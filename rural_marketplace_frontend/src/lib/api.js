// src/lib/api.js

// ✅ Se houver VITE_API_URL no .env, usa absoluto; caso contrário, usa proxy (/api)
const API_BASE = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
  ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') // remove barra final
  : '/api' // ← proxy do Vite

function buildUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${suffix}`
}

async function parseJsonSafe(res) {
  try { return await res.json() } catch { return {} }
}

export const api = {
  // 🔹 POST — criar / autenticar / etc.
  async post(path, body) {
    const url = buildUrl(path)
    console.log('📤 POST →', url, body)

    let res
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
    } catch (err) {
      console.error('❌ Erro de conexão com o servidor:', err)
      throw new Error('Falha de conexão com o servidor (backend está ativo?)')
    }

    const data = await parseJsonSafe(res)
    if (!res.ok) {
      const msg = data?.message || res.statusText || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return data
  },

  // 🔹 GET — consultas públicas (/health, etc.)
  async get(path) {
    const url = buildUrl(path)
    console.log('📥 GET →', url)

    let res
    try {
      res = await fetch(url)
    } catch (err) {
      console.error('❌ Erro de conexão com o servidor:', err)
      throw new Error('Falha de conexão com o servidor (backend está ativo?)')
    }

    const data = await parseJsonSafe(res)
    if (!res.ok) {
      const msg = data?.message || res.statusText || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return data
  },
}

// ✅ Teste rápido (opcional):
// api.get('/health').then(console.log).catch(console.error)
