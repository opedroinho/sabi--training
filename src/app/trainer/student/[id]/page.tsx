import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentDetailClient } from '@/components/trainer/StudentDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: student }, { data: assignment }] = await Promise.all([
    supabase.from('profiles').select('id, name, status').eq('id', id).single(),
    supabase.from('assignments')
      .select('id, template_id')
      .eq('student_id', id)
      .eq('trainer_id', user!.id)
      .maybeSingle(),
  ])

  // Fetch templates owned by this trainer that belong to this student.
  // Uses OR: student_id matches directly, OR the template is the one
  // currently assigned to this student (handles pre-migration templates).
  const assignedTemplateId = assignment?.template_id
  let templatesQuery = supabase
    .from('templates')
    .select('id, name, version, updated_at')
    .eq('trainer_id', user!.id)
    .order('updated_at', { ascending: false })

  if (assignedTemplateId) {
    // student_id = id OR id = assignedTemplateId
    templatesQuery = templatesQuery.or(`student_id.eq.${id},id.eq.${assignedTemplateId}`)
  } else {
    templatesQuery = templatesQuery.eq('student_id', id)
  }

  const { data: templates } = await templatesQuery

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
