import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentDetailClient } from '@/components/trainer/StudentDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: student }, { data: templates }, { data: assignment }] = await Promise.all([
    supabase.from('profiles').select('id, name, status').eq('id', id).single(),
    supabase.from('templates')
      .select('id, name, version, updated_at')
      .eq('student_id', id)
      .eq('trainer_id', user!.id)
      .order('updated_at', { ascending: false }),
    supabase.from('assignments')
      .select('id, template_id')
      .eq('student_id', id)
      .eq('trainer_id', user!.id)
      .maybeSingle(),
  ])

  if (!student) redirect('/trainer')

  return (
    <StudentDetailClient
      trainerId={user!.id}
      student={student}
      templates={templates ?? []}
      activeTemplateId={assignment?.template_id ?? null}
      assignmentId={assignment?.id ?? null}
    />
  )
}
