'use client'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Hard navigation ensures cookies are cleared before proxy evaluates the next request
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
      style={{ background: 'transparent', border: '1px solid #c9a050', color: '#c9a050' }}
    >
      SAIR
    </button>
  )
}
