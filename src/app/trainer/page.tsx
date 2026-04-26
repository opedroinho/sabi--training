import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { CreateStudentForm } from '@/components/trainer/CreateStudentForm'

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
        <span style={{ fontSize: 20, fontWeight: 900, color: gold, border: `2px solid ${gold}`, padding: '2px 8px', borderRadius: 4, letterSpacing: -1 }}>WS</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: gold, letterSpacing: 1 }}>WILSON SABIÁ</div>
          <div style={{ fontSize: 10, color: '#555' }}>Dashboard do Trainer</div>
        </div>
        <span style={{ fontSize: 11, color: '#666' }}>{profile?.name}</span>
        <LogoutButton />
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── CREATE STUDENT ── */}
        <CreateStudentForm />

        {/* ── STUDENT CARDS ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#555', marginBottom: 14 }}>
            ALUNOS {students?.length ? `(${students.length})` : ''}
          </div>

          {(!students || students.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12 }}>
              Nenhum aluno cadastrado ainda.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {(students ?? []).map(student => {
              const isActive = student.status !== 'inactive'
              const training = activeTraining[student.id]
              return (
                <Link
                  key={student.id}
                  href={`/trainer/student/${student.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#111', border: `1px solid ${isActive ? '#2a2a2a' : '#1e1e1e'}`,
                    borderRadius: 10, padding: '16px 18px', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    opacity: isActive ? 1 : 0.6,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = gold)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = isActive ? '#2a2a2a' : '#1e1e1e')}
                  >
                    {/* status + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: isActive ? '#4dc87a' : '#555',
                        boxShadow: isActive ? '0 0 6px #4dc87a88' : 'none',
                      }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8e8', flex: 1 }}>
                        {student.name}
                      </span>
                      {!isActive && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#555', background: '#1a1a1a', padding: '2px 6px', borderRadius: 3 }}>
                          INATIVO
                        </span>
                      )}
                    </div>

                    {/* active training */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-icons-outlined" style={{ fontSize: 13, color: training ? gold : '#333' }}>
                        fitness_center
                      </span>
                      <span style={{ fontSize: 11, color: training ? '#c8c8c8' : '#444' }}>
                        {training ?? 'Sem treino ativo'}
                      </span>
                    </div>

                    {/* arrow */}
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <span className="material-icons-outlined" style={{ fontSize: 16, color: '#333' }}>arrow_forward</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
