import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '@/components/trainer/TemplateEditor'
import Link from 'next/link'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!template) redirect('/trainer')

  // Check if this template has active assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('template_id', id)

  const hasAssignments = (assignments?.length ?? 0) > 0

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <TemplateEditor template={template} hasAssignments={hasAssignments} />
    </div>
  )
}
