// src/lib/fetchAuth.js
// Centraliza chamadas autenticadas e faz logout automático em 401/403.

export async function fetchAuth(url, options = {}, onUnauthorized) {
  try {
    const res = await fetch(url, options)
    const data = await res.json().catch(() => ({}))

    if (res.status === 401 || res.status === 403) {
      console.warn('[fetchAuth] Sessão expirada/acesso negado:', res.status)
      if (onUnauthorized) onUnauthorized('Sessão expirada. Faça login novamente.')
      throw new Error(data?.message || 'Sessão expirada. Faça login novamente.')
    }

    if (!res.ok) {
      throw new Error(data?.message || res.statusText || 'Erro na requisição')
    }

    return data
  } catch (err) {
    console.error('[fetchAuth] Falha na requisição:', err)
    throw err
  }
}
