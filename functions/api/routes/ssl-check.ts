import { Hono } from 'hono'
import type { Env } from '../[[route]]'

export const sslCheckRoute = new Hono<{ Bindings: Env }>()

interface SslResult {
  domain: string
  valid: boolean
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysRemaining: number
  serialNumber: string
  signatureAlgorithm: string
  sans: string[]
  error?: string
}

sslCheckRoute.get('/', async (c) => {
  const domain = c.req.query('domain')

  if (!domain) {
    return c.json({ error: 'domain is required' }, 400)
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]

  const cacheKey = `cache:ssl:${cleanDomain}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch {}

  try {
    const res = await fetch(`https://api.hackertarget.com/sslcheck/?q=${encodeURIComponent(cleanDomain)}`)
    
    if (!res.ok) {
      return c.json({ error: 'SSL check failed' }, 502)
    }

    const rawText = await res.text()
    
    const result: SslResult = {
      domain: cleanDomain,
      valid: false,
      issuer: '',
      subject: '',
      validFrom: '',
      validTo: '',
      daysRemaining: 0,
      serialNumber: '',
      signatureAlgorithm: '',
      sans: [],
    }

    const issuerMatch = rawText.match(/Issuer:\s*(.+)/i)
    if (issuerMatch) result.issuer = issuerMatch[1].trim()

    const subjectMatch = rawText.match(/Subject:\s*(.+)/i)
    if (subjectMatch) result.subject = subjectMatch[1].trim()

    const validFromMatch = rawText.match(/Not Before:\s*(.+)/i) || rawText.match(/Valid From:\s*(.+)/i)
    if (validFromMatch) result.validFrom = validFromMatch[1].trim()

    const validToMatch = rawText.match(/Not After:\s*(.+)/i) || rawText.match(/Valid To:\s*(.+)/i)
    if (validToMatch) {
      result.validTo = validToMatch[1].trim()
      
      try {
        const expiryDate = new Date(result.validTo)
        const now = new Date()
        result.daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        result.valid = result.daysRemaining > 0
      } catch {
        result.valid = false
      }
    }

    const serialMatch = rawText.match(/Serial Number:\s*(.+)/i)
    if (serialMatch) result.serialNumber = serialMatch[1].trim()

    const sigAlgMatch = rawText.match(/Signature Algorithm:\s*(.+)/i)
    if (sigAlgMatch) result.signatureAlgorithm = sigAlgMatch[1].trim()

    const sanMatch = rawText.match(/Subject Alternative Names?:\s*(.+)/i)
    if (sanMatch) {
      result.sans = sanMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    }

    if (!result.issuer && rawText.includes('SSL Certificate')) {
      const lines = rawText.split('\n')
      for (const line of lines) {
        if (line.includes('CN=') && !result.issuer) {
          const cnMatch = line.match(/CN=([^,]+)/)
          if (cnMatch) result.issuer = cnMatch[1]
        }
      }
    }

    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })
    } catch {}

    return c.json(result)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})
