import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { CreateStudentForm } from '@/components/trainer/CreateStudentForm'
import { StudentList } from '@/components/trainer/StudentList'
import { TemplateList } from '@/components/trainer/TemplateList'

export default async function TrainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: students }, { data: templates }, { data: assignments }] =
    await Promise.all([
      supabase.from('profiles').select('name').eq('id', user!.id).single(),
      supabase.from('profiles').select('id, name').eq('role', 'student').order('name'),
      supabase.from('templates').select('id, name, version, updated_at').eq('trainer_id', user!.id).order('updated_at', { ascending: false }),
      supabase.from('assignments').select('id, student_id, template_id, pending_version').eq('trainer_id', user!.id),
    ])

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
        style={{ background: '#111', borderBottom: '2px solid #c9a050' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-black px-2 py-0.5 rounded"
            style={{ color: '#c9a050', border: '2px solid #c9a050', letterSpacing: '-1px' }}
          >
            WS
          </span>
          <div>
            <div className="text-xs font-bold tracking-widest" style={{ color: '#c9a050' }}>
              WILSON SABIÁ
            </div>
            <div className="text-xs" style={{ color: '#666' }}>
              Dashboard do Trainer
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#888' }}>
            {profile?.name}
          </span>
          <LogoutButton />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-5 space-y-6">
        {/* Templates section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-widest" style={{ color: '#c9a050' }}>
              TREINOS
            </h2>
            <Link
              href="/trainer/template/new"
              className="px-4 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
              style={{ background: '#c9a050', color: '#000' }}
            >
              + NOVO TREINO
            </Link>
          </div>
          <TemplateList templates={templates ?? []} assignments={assignments ?? []} />
        </section>

        {/* Students section */}
        <section>
          <h2 className="text-sm font-bold tracking-widest mb-3" style={{ color: '#c9a050' }}>
            ALUNOS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <CreateStudentForm />
            </div>
            <div className="lg:col-span-2">
              <StudentList
                students={students ?? []}
                templates={templates ?? []}
                assignments={assignments ?? []}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
