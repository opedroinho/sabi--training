'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Usuário ou senha incorretos.')
      setLoading(false)
      return
    }

    // Hard navigation ensures session cookies are sent before the server renders
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-block text-4xl font-black mb-2 px-4 py-2 rounded"
            style={{ color: '#c9a050', border: '2px solid #c9a050', letterSpacing: '-2px' }}
          >
            WS
          </div>
          <div className="text-xs font-bold tracking-widest mt-1" style={{ color: '#c9a050' }}>
            WILSON SABIÁ
          </div>
          <div className="text-xs tracking-widest mt-0.5" style={{ color: '#666' }}>
            PERSONAL TRAINER
          </div>
        </div>

        {/* Card */}
        <div className="rounded-lg p-6" style={{ background: '#111', border: '1px solid #333' }}>
          <h2 className="text-center text-sm font-bold tracking-widest mb-6" style={{ color: '#c9a050' }}>
            ACESSO À PLATAFORMA
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#888' }}>
                E-MAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  background: '#1c1c1c',
                  border: '1px solid #333',
                  color: '#e8e8e8',
                }}
                onFocus={e => (e.target.style.borderColor = '#c9a050')}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#888' }}>
                SENHA
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  background: '#1c1c1c',
                  border: '1px solid #333',
                  color: '#e8e8e8',
                }}
                onFocus={e => (e.target.style.borderColor = '#c9a050')}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: '#e05a5a' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-bold text-sm tracking-wider transition-opacity"
              style={{
                background: '#c9a050',
                color: '#000',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#444' }}>
          DISCIPLINA • FOCO • CONSTÂNCIA • RESULTADOS
        </p>
      </div>
    </div>
  )
}
