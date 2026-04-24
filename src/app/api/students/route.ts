import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Admin client — uses service role key, runs only on the server
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  // Verify caller is a trainer
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'trainer')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password } = await req.json()

  const admin = adminClient()

  // Create auth user
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !newUser.user)
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })

  // Create profile
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: newUser.user.id, name, role: 'student' })

  if (profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ id: newUser.user.id, name, email })
}
