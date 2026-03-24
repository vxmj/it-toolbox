import { Hono } from 'hono'
import type { Env } from '../[[route]]'

export const headersCheckRoute = new Hono<{ Bindings: Env }>()

interface HeaderCheck {
  name: string
  present: boolean
  value?: string
  recommendation: string
  severity: 'high' | 'medium' | 'low'
}

interface HeadersResult {
  url: string
  headers: HeaderCheck[]
  score: number
  grade: string
}

const SECURITY_HEADERS_CONFIG = [
  {
    name: 'Strict-Transport-Security',
    recommendation: '启用HSTS强制HTTPS连接，建议设置max-age至少31536000秒',
    severity: 'high' as const,
  },
  {
    name: 'Content-Security-Policy',
    recommendation: '设置CSP限制资源加载来源，防止XSS攻击',
    severity: 'high' as const,
  },
  {
    name: 'X-Content-Type-Options',
    recommendation: '设置为nosniff防止MIME类型嗅探',
    severity: 'medium' as const,
  },
  {
    name: 'X-Frame-Options',
    recommendation: '设置为DENY或SAMEORIGIN防止点击劫持',
    severity: 'medium' as const,
  },
  {
    name: 'X-XSS-Protection',
    recommendation: '设置为1; mode=block启用XSS过滤器（现代浏览器中CSP更有效）',
    severity: 'low' as const,
  },
  {
    name: 'Referrer-Policy',
    recommendation: '设置为strict-origin-when-cross-origin控制Referrer信息',
    severity: 'low' as const,
  },
  {
    name: 'Permissions-Policy',
    recommendation: '限制浏览器功能访问（摄像头、麦克风、地理位置等）',
    severity: 'medium' as const,
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    recommendation: '设置为same-origin防止跨源信息泄露',
    severity: 'medium' as const,
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    recommendation: '设置为same-origin防止跨源资源加载',
    severity: 'medium' as const,
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    recommendation: '设置为require-corp增强跨源隔离',
    severity: 'low' as const,
  },
]

headersCheckRoute.get('/', async (c) => {
  const url = c.req.query('url')

  if (!url) {
    return c.json({ error: 'url is required' }, 400)
  }

  let cleanUrl = url.trim().toLowerCase()
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl
  }

  try {
    new URL(cleanUrl)
  } catch {
    return c.json({ error: 'Invalid URL' }, 400)
  }

  const cacheKey = `cache:headers:${cleanUrl}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch {}

  try {
    const res = await fetch(cleanUrl, {
      method: 'HEAD',
      redirect: 'follow',
    })

    const headers: HeaderCheck[] = SECURITY_HEADERS_CONFIG.map(config => {
      const headerValue = res.headers.get(config.name)
      return {
        name: config.name,
        present: headerValue !== null,
        value: headerValue || undefined,
        recommendation: config.recommendation,
        severity: config.severity,
      }
    })

    let score = 0
    headers.forEach(header => {
      if (header.present) {
        if (header.severity === 'high') score += 15
        else if (header.severity === 'medium') score += 10
        else score += 5
      }
    })

    score = Math.min(100, score)

    let grade = 'F'
    if (score >= 95) grade = 'A+'
    else if (score >= 90) grade = 'A'
    else if (score >= 80) grade = 'B'
    else if (score >= 70) grade = 'C'
    else if (score >= 60) grade = 'D'

    const result: HeadersResult = {
      url: cleanUrl,
      headers,
      score,
      grade,
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch {}

    return c.json(result)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})
