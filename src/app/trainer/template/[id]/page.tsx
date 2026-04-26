import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '@/components/trainer/TemplateEditor'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ student?: string }>
}

export default async function EditTemplatePage({ params, searchParams }: Props) {
  const { id } = await params
  const { student: studentId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!template) redirect('/trainer')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('template_id', id)

  const hasAssignments = (assignments?.length ?? 0) > 0
  const backHref = studentId
    ? `/trainer/student/${studentId}`
    : template.student_id
      ? `/trainer/student/${template.student_id}`
      : '/trainer'

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <TemplateEditor template={template} hasAssignments={hasAssignments} backHref={backHref} />
    </div>
  )
}
