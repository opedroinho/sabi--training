import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentWorkoutView } from '@/components/student/StudentWorkoutView'

export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: assignment }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user!.id).single(),
    supabase
      .from('assignments')
      .select('id, template_id, current_version, pending_version')
      .eq('student_id', user!.id)
      .single(),
  ])

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center p-8 rounded-lg" style={{ border: '1px solid #333', background: '#111' }}>
          <span className="material-icons-outlined text-5xl mb-4 block" style={{ color: '#c9a050' }}>
            fitness_center
          </span>
          <p className="font-bold mb-1" style={{ color: '#c9a050' }}>Nenhum treino atribuído</p>
          <p className="text-sm" style={{ color: '#888' }}>
            Aguarde seu personal atribuir um treino para você.
          </p>
        </div>
      </div>
    )
  }

  const [{ data: template }, { data: record }] = await Promise.all([
    supabase
      .from('templates')
      .select('id, name, version, data')
      .eq('id', assignment.template_id)
      .single(),
    supabase
      .from('student_records')
      .select('data')
      .eq('assignment_id', assignment.id)
      .single(),
  ])

  if (!template) redirect('/student')

  return (
    <StudentWorkoutView
      studentName={profile?.name ?? ''}
      assignment={assignment}
      template={template}
      initialRecord={record?.data ?? {}}
    />
  )
}
