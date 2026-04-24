import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: role, error } = await supabase.rpc('get_my_role')

  if (role === 'trainer') redirect('/trainer')
  if (role === 'student') redirect('/student')

  // Profile missing or RLS error — show a clear message instead of looping back to /login
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '2rem', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ color: '#c9a050', fontWeight: 'bold', letterSpacing: 2, marginBottom: '1rem' }}>
          PERFIL NÃO ENCONTRADO
        </div>
        <p style={{ color: '#888', fontSize: 14, marginBottom: '1.5rem' }}>
          Sua conta foi autenticada mas não tem um perfil associado.<br />
          Peça ao Wilson para recadastrar seu acesso.
        </p>
        <p style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
          user: {user.email}<br />
          {error ? `erro: ${(error as any).message ?? JSON.stringify(error)}` : 'perfil: não encontrado'}
        </p>
        <form action="/api/logout" method="POST" style={{ marginTop: '1.5rem' }}>
          <button
            type="submit"
            style={{ background: 'none', border: 'none', color: '#c9a050', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
