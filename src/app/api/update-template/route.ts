import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Trainer saves a new version of a template → bumps version + sets pending_version on all assignments
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { templateId, data, name } = await req.json()

  // Fetch current version
  const { data: template, error: fetchError } = await supabase
    .from('templates')
    .select('version, trainer_id')
    .eq('id', templateId)
    .single()

  if (fetchError || !template)
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  if (template.trainer_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const newVersion = template.version + 1

  // Save new version
  const { error: updateError } = await supabase
    .from('templates')
    .update({ data, name, version: newVersion })
    .eq('id', templateId)

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 })

  // Mark all assignments with this template as having a pending update
  await supabase
    .from('assignments')
    .update({ pending_version: newVersion })
    .eq('template_id', templateId)
    .eq('trainer_id', user.id)

  return NextResponse.json({ version: newVersion })
}
