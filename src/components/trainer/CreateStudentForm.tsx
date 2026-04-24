'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateStudentForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const json = await res.json()

    if (!res.ok) {
      setMsg({ type: 'err', text: json.error ?? 'Erro ao criar aluno.' })
    } else {
      setMsg({ type: 'ok', text: `Aluno "${name}" criado com sucesso!` })
      setName('')
      setEmail('')
      setPassword('')
      router.refresh()
    }
    setLoading(false)
  }

  const inputStyle = {
    background: '#1c1c1c',
    border: '1px solid #333',
    color: '#e8e8e8',
    borderRadius: '4px',
    padding: '6px 10px',
    width: '100%',
    fontSize: '12px',
    outline: 'none',
  }

  return (
    <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #333' }}>
      <h3 className="text-xs font-bold tracking-widest mb-4" style={{ color: '#c9a050' }}>
        + NOVO ALUNO
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: '#888' }}>Nome</label>
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Nome do aluno" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#c9a050')}
            onBlur={e => (e.target.style.borderColor = '#333')}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#888' }}>E-mail</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="aluno@email.com" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#c9a050')}
            onBlur={e => (e.target.style.borderColor = '#333')}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#888' }}>Senha</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Senha de acesso" style={inputStyle} minLength={6}
            onFocus={e => (e.target.style.borderColor = '#c9a050')}
            onBlur={e => (e.target.style.borderColor = '#333')}
          />
        </div>

        {msg && (
          <p className="text-xs" style={{ color: msg.type === 'ok' ? '#4dc87a' : '#e05a5a' }}>
            {msg.text}
          </p>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-2 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
          style={{ background: '#c9a050', color: '#000', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'CRIANDO...' : 'CRIAR ALUNO'}
        </button>
      </form>
    </div>
  )
}
