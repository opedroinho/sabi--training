import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { CreateStudentForm } from '@/components/trainer/CreateStudentForm'
import { StudentGrid } from '@/components/trainer/StudentGrid'
import { InstallPwaButton } from '@/components/InstallPwaButton'
import { SabiaWordmark } from '@/components/SabiaWordmark'

const gold = '#c9a050'

export default async function TrainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: students }, { data: assignments }] =
    await Promise.all([
      supabase.from('profiles').select('name').eq('id', user!.id).single(),
      supabase.from('profiles').select('id, name, status').eq('role', 'student').order('name'),
      supabase.from('assignments').select('student_id, template_id, templates(name)').eq('trainer_id', user!.id),
    ])

  // Map student_id → active training name
  const activeTraining: Record<string, string> = {}
  for (const a of assignments ?? []) {
    const tpl = a.templates as unknown as { name: string } | null
    if (tpl) activeTraining[a.student_id] = tpl.name
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#111', borderBottom: `2px solid ${gold}`,
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <SabiaWordmark height={34} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#555' }}>Dashboard do Trainer</div>
        </div>
        <span style={{ fontSize: 11, color: '#666' }}>{profile?.name}</span>
        <LogoutButton />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="ws-dashboard">

          {/* ── STUDENT CARDS (left, 2/3) ── */}
          <div className="ws-dashboard-students">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#555', marginBottom: 14 }}>
              ALUNOS {students?.length ? `(${students.length})` : ''}
            </div>
            <StudentGrid students={students ?? []} activeTraining={activeTraining} />
          </div>

          {/* ── ADD STUDENT (right, 1/3) ── */}
          <div className="ws-dashboard-form" style={{ position: 'sticky', top: 72 }}>
            <InstallPwaButton />
            <CreateStudentForm />
          </div>

        </div>
      </div>
    </div>
  )
}
