import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentWorkoutView } from '@/components/student/StudentWorkoutView'
import { LogoutButton } from '@/components/LogoutButton'

export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: assignment }] = await Promise.all([
    supabase.from('profiles').select('name, status').eq('id', user!.id).single(),
    supabase
      .from('assignments')
      .select('id, template_id, current_version, pending_version')
      .eq('student_id', user!.id)
      .single(),
  ])

  // ── Inactive student ──────────────────────────────────────────────────────
  if (profile?.status === 'inactive') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: '#111', borderBottom: '2px solid #333',
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img src="/sabia-logo.svg" alt="Wilson Sabiá" style={{ height: 30, flexShrink: 0, opacity: 0.4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#444' }}>{profile?.name}</div>
          </div>
          <LogoutButton />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <span className="material-icons-outlined" style={{ fontSize: 52, color: '#333', marginBottom: 16, display: 'block' }}>
              pause_circle
            </span>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#555', letterSpacing: 2, marginBottom: 12 }}>
              CONTA PAUSADA
            </div>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 20 }}>
              Seu acesso ao treino está temporariamente suspenso. Entre em contato com Wilson Sabiá para mais informações.
            </p>
            <a
              href="https://wa.me"
              style={{ fontSize: 11, color: '#555', textDecoration: 'underline' }}
            >
              Falar com o Wilson
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── No assignment yet ─────────────────────────────────────────────────────
  if (!assignment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: '#111', borderRadius: 10, border: '1px solid #222', maxWidth: 320 }}>
          <span className="material-icons-outlined" style={{ fontSize: 48, color: '#c9a050', marginBottom: 14, display: 'block' }}>
            fitness_center
          </span>
          <p style={{ fontWeight: 700, color: '#c9a050', marginBottom: 8 }}>Nenhum treino atribuído</p>
          <p style={{ fontSize: 12, color: '#666' }}>
            Aguarde o Wilson atribuir um treino para você.
          </p>
        </div>
      </div>
    )
  }

  // ── Active student with assignment ────────────────────────────────────────
  const [{ data: template }, { data: record }] = await Promise.all([
    supabase.from('templates').select('id, name, version, data').eq('id', assignment.template_id).single(),
    supabase.from('student_records').select('data').eq('assignment_id', assignment.id).single(),
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
