import settings from 'electron-settings'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

const PROXY_PROTOCOLS = ['http:', 'https:']

let cached = { url: '', agent: null }

export const normalizeProxy = (value) => {
  const raw = (value || '').trim()
  if (!raw) return ''
  const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`)
  if (!PROXY_PROTOCOLS.includes(url.protocol)) {
    throw new Error('Proxy must be an http:// or https:// address.')
  }
  return url.href.replace(/\/$/, '')
}

export const getProxy = () => settings.getSync('proxy') || ''

export const setProxy = (value) => {
  const proxy = normalizeProxy(value)
  if (proxy) settings.setSync('proxy', proxy)
  else settings.unsetSync('proxy')
  return proxy
}

const getAgent = (proxy) => {
  if (cached.url !== proxy) {
    cached.agent?.close().catch(() => {})
    cached = { url: proxy, agent: new ProxyAgent(proxy) }
  }
  return cached.agent
}

// Node's built-in fetch ignores proxies, so route through undici only when one is configured.
export const proxyFetch = (link, init = {}) => {
  const proxy = getProxy()
  if (!proxy) return fetch(link, init)
  return undiciFetch(link, { ...init, dispatcher: getAgent(proxy) })
}
