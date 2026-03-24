import { Hono } from 'hono'
import type { Env } from '../[[route]]'

export const whoisRoute = new Hono<{ Bindings: Env }>()

interface WhoisResult {
  domain: string
  registrar?: string
  createdDate?: string
  updatedDate?: string
  expiryDate?: string
  status?: string[]
  nameservers?: string[]
  registrant?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  raw?: string
  error?: string
}

whoisRoute.get('/', async (c) => {
  const domain = c.req.query('domain')

  if (!domain) {
    return c.json({ error: 'domain is required' }, 400)
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]

  const cacheKey = `cache:whois:${cleanDomain}`
  try {
    const cached = await c.env.CACHE.get(cacheKey)
    if (cached) {
      return c.json({ ...JSON.parse(cached), cached: true })
    }
  } catch {}

  try {
    const res = await fetch(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(cleanDomain)}`)
    
    if (!res.ok) {
      return c.json({ error: 'WHOIS query failed' }, 502)
    }

    const rawText = await res.text()
    
    const result: WhoisResult = {
      domain: cleanDomain,
      raw: rawText,
    }

    const registrarMatch = rawText.match(/Registrar:\s*(.+)/i)
    if (registrarMatch) result.registrar = registrarMatch[1].trim()

    const createdMatch = rawText.match(/Creation Date:\s*(.+)/i) || rawText.match(/Created:\s*(.+)/i)
    if (createdMatch) result.createdDate = createdMatch[1].trim()

    const updatedMatch = rawText.match(/Updated Date:\s*(.+)/i) || rawText.match(/Updated:\s*(.+)/i)
    if (updatedMatch) result.updatedDate = updatedMatch[1].trim()

    const expiryMatch = rawText.match(/Registry Expiry Date:\s*(.+)/i) || rawText.match(/Expiry:\s*(.+)/i)
    if (expiryMatch) result.expiryDate = expiryMatch[1].trim()

    const statusMatches = rawText.matchAll(/Domain Status:\s*(.+)/gi)
    const statuses: string[] = []
    for (const match of statusMatches) {
      statuses.push(match[1].trim())
    }
    if (statuses.length > 0) result.status = statuses

    const nsMatches = rawText.matchAll(/Name Server:\s*(.+)/gi)
    const nameservers: string[] = []
    for (const match of nsMatches) {
      nameservers.push(match[1].trim().toLowerCase())
    }
    if (nameservers.length > 0) result.nameservers = nameservers

    const registrantNameMatch = rawText.match(/Registrant Name:\s*(.+)/i)
    const registrantOrgMatch = rawText.match(/Registrant Organization:\s*(.+)/i)
    const registrantCountryMatch = rawText.match(/Registrant Country:\s*(.+)/i)
    const registrantEmailMatch = rawText.match(/Registrant Email:\s*(.+)/i)

    if (registrantNameMatch || registrantOrgMatch || registrantCountryMatch || registrantEmailMatch) {
      result.registrant = {
        name: registrantNameMatch?.[1].trim(),
        organization: registrantOrgMatch?.[1].trim(),
        country: registrantCountryMatch?.[1].trim(),
        email: registrantEmailMatch?.[1].trim(),
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
