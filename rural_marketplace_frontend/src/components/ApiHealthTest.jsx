// src/components/ApiHealthTest.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function ApiHealthTest() {
  const [status, setStatus] = useState('⏳ testando...')
  const [error, setError] = useState(null)

  const ping = async () => {
    setStatus('⏳ testando...')
    setError(null)
    try {
      const data = await api.get('/health')
      setStatus(`✅ ok — ${data?.status || 'online'}`)
      console.log('🔎 /api/health →', data)
    } catch (err) {
      console.error('❌ Falha no /api/health:', err)
      setStatus('❌ falhou')
      setError(err?.message || String(err))
    }
  }

  useEffect(() => {
    ping()
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      right: 12,
      background: '#111',
      color: '#fff',
      padding: '10px 12px',
      borderRadius: 12,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      boxShadow: '0 6px 20px rgba(0,0,0,.25)',
      zIndex: 9999
    }}>
      <div><strong>API Health:</strong> {status}</div>
      {error && <div style={{ marginTop: 6, opacity: .8 }}>Erro: {error}</div>}
      <button
        onClick={ping}
        style={{
          marginTop: 8, padding: '6px 10px',
          borderRadius: 8, border: '1px solid #444',
          background: '#222', color: '#fff', cursor: 'pointer'
        }}
      >
        Testar novamente
      </button>
    </div>
  )
}
