import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { ipRoute } from './routes/ip'
import { dnsRoute } from './routes/dns'
import { aiRoute } from './routes/ai'
import { exchangeRoute } from './routes/exchange'
import { proxyRoute } from './routes/proxy'
import { whoisRoute } from './routes/whois'
import { sslCheckRoute } from './routes/ssl-check'
import { headersCheckRoute } from './routes/headers-check'

export interface Env {
  CACHE: KVNamespace
  FILES: R2Bucket
  AI: Ai
  ENVIRONMENT: string
  EXCHANGE_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.route('/api/ip', ipRoute)
app.route('/api/dns', dnsRoute)
app.route('/api/ai', aiRoute)
app.route('/api/exchange', exchangeRoute)
app.route('/api/proxy', proxyRoute)
app.route('/api/whois', whoisRoute)
app.route('/api/ssl-check', sslCheckRoute)
app.route('/api/headers-check', headersCheckRoute)

export const onRequest = handle(app)
