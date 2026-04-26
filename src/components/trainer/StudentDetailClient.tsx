'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const gold = '#c9a050'

interface Template { id: string; name: string; version: number; updated_at: string }
interface Student  { id: string; name: string; status: string }

interface Props {
  trainerId: string
  student: Student
  templates: Template[]
  activeTemplateId: string | null
  assignmentId: string | null
}

type Modal =
  | { type: 'set-active'; template: Template }
  | { type: 'toggle-status'; newStatus: 'active' | 'inactive' }
  | null

export function StudentDetailClient({ trainerId, student, templates, activeTemplateId, assignmentId }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActive = student.status !== 'inactive'

  // ── Set active template ──────────────────────────────────────────────────────
  async function confirmSetActive(template: Template) {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (assignmentId) {
      const { error } = await supabase
        .from('assignments')
        .update({ template_id: template.id, current_version: template.version, pending_version: null })
        .eq('id', assignmentId)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase
        .from('assignments')
        .insert({ student_id: student.id, trainer_id: trainerId, template_id: template.id, current_version: template.version })
      if (error) { setError(error.message); setLoading(false); return }
    }

    setModal(null)
    setLoading(false)
    router.refresh()
  }

  // ── Toggle student status ────────────────────────────────────────────────────
  async function confirmToggleStatus(newStatus: 'active' | 'inactive') {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.rpc('set_student_status', {
      p_student_id: student.id,
      p_new_status: newStatus,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setModal(null)
    setLoading(false)
    router.refresh()
  }

  function relativeDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'hoje'
    if (days === 1) return 'ontem'
    return `há ${days} dias`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#111', borderBottom: `2px solid ${gold}`,
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/trainer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', textDecoration: 'none', fontSize: 11 }}>
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Dashboard
        </Link>
        <span style={{ color: '#333' }}>|</span>
        <span style={{ fontSize: 11, color: '#666', flex: 1 }}>Perfil do aluno</span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── STUDENT HEADER ── */}
        <div style={{
          background: '#111', border: '1px solid #222', borderRadius: 10,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: isActive ? '#4dc87a' : '#555',
              boxShadow: isActive ? '0 0 8px #4dc87a88' : 'none',
            }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#e8e8e8' }}>{student.name}</div>
              <div style={{ fontSize: 10, color: isActive ? '#4dc87a' : '#555', fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>
                {isActive ? 'ATIVO' : 'INATIVO'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setModal({ type: 'toggle-status', newStatus: isActive ? 'inactive' : 'active' })}
            style={{
              background: 'transparent',
              border: `1px solid ${isActive ? '#555' : '#4dc87a'}`,
              color: isActive ? '#888' : '#4dc87a',
              padding: '7px 14px', borderRadius: 6, fontSize: 11,
              fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            {isActive ? 'INATIVAR ALUNO' : 'REATIVAR ALUNO'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #e05a5a', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 11, color: '#e05a5a' }}>
            {error}
          </div>
        )}

        {/* ── TRAININGS SECTION ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#555' }}>
            TREINOS {templates.length > 0 ? `(${templates.length})` : ''}
          </div>
          <Link
            href={`/trainer/template/new?student=${student.id}`}
            style={{
              background: gold, color: '#000', textDecoration: 'none',
              padding: '7px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 14 }}>add</span>
            NOVO TREINO
          </Link>
        </div>

        {templates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12, background: '#111', borderRadius: 8, border: '1px dashed #222' }}>
            Nenhum treino criado para este aluno ainda.<br />
            <span style={{ color: '#555' }}>Clique em "+ NOVO TREINO" para começar.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => {
            const isActiveTemplate = t.id === activeTemplateId
            return (
              <div key={t.id} style={{
                background: '#111',
                border: `1px solid ${isActiveTemplate ? gold : '#222'}`,
                borderRadius: 8, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
              }}>
                {/* active badge */}
                {isActiveTemplate && (
                  <span style={{
                    background: gold, color: '#000', fontSize: 9, fontWeight: 900,
                    padding: '2px 8px', borderRadius: 3, letterSpacing: 1, flexShrink: 0,
                  }}>ATIVO</span>
                )}

                {/* name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActiveTemplate ? gold : '#e8e8e8', marginBottom: 3 }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#555' }}>
                    v{t.version} • Atualizado {relativeDate(t.updated_at)}
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!isActiveTemplate && (
                    <button
                      onClick={() => setModal({ type: 'set-active', template: t })}
                      style={{
                        background: 'transparent', border: `1px solid ${gold}`, color: gold,
                        padding: '5px 12px', borderRadius: 5, fontSize: 10,
                        fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
                      }}
                    >
                      DEFINIR ATIVO
                    </button>
                  )}
                  <Link
                    href={`/trainer/template/${t.id}`}
                    style={{
                      background: '#1c1c1c', border: '1px solid #333', color: '#888',
                      padding: '5px 12px', borderRadius: 5, fontSize: 10,
                      fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5,
                    }}
                  >
                    EDITAR
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
          onClick={() => !loading && setModal(null)}
        >
          <div
            style={{ background: '#111', border: `1px solid ${gold}`, borderRadius: 10, padding: '28px 32px', maxWidth: 400, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            {modal.type === 'set-active' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: gold, marginBottom: 12 }}>CONFIRMAR ALTERAÇÃO</div>
                <p style={{ fontSize: 13, color: '#ccc', marginBottom: 6 }}>
                  Definir <strong style={{ color: '#fff' }}>{modal.template.name}</strong> como treino ativo de <strong style={{ color: '#fff' }}>{student.name}</strong>?
                </p>
                <p style={{ fontSize: 11, color: '#666', marginBottom: 24 }}>
                  O treino anterior será desativado e o aluno passará a ver este novo treino.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} disabled={loading} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 18px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                    CANCELAR
                  </button>
                  <button onClick={() => confirmSetActive(modal.template)} disabled={loading} style={{ background: gold, color: '#000', border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'SALVANDO...' : 'CONFIRMAR'}
                  </button>
                </div>
              </>
            )}

            {modal.type === 'toggle-status' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: modal.newStatus === 'inactive' ? '#e05a5a' : '#4dc87a', marginBottom: 12 }}>
                  {modal.newStatus === 'inactive' ? 'INATIVAR ALUNO' : 'REATIVAR ALUNO'}
                </div>
                <p style={{ fontSize: 13, color: '#ccc', marginBottom: 6 }}>
                  {modal.newStatus === 'inactive'
                    ? <>Inativar <strong style={{ color: '#fff' }}>{student.name}</strong>?</>
                    : <>Reativar <strong style={{ color: '#fff' }}>{student.name}</strong>?</>
                  }
                </p>
                <p style={{ fontSize: 11, color: '#666', marginBottom: 24 }}>
                  {modal.newStatus === 'inactive'
                    ? 'O aluno verá uma mensagem informando que sua conta está pausada e não terá acesso ao treino.'
                    : 'O aluno voltará a ter acesso normal ao treino ativo.'
                  }
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} disabled={loading} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 18px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                    CANCELAR
                  </button>
                  <button
                    onClick={() => confirmToggleStatus(modal.newStatus)}
                    disabled={loading}
                    style={{
                      background: modal.newStatus === 'inactive' ? '#e05a5a' : '#4dc87a',
                      color: '#000', border: 'none', padding: '8px 18px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? '...' : modal.newStatus === 'inactive' ? 'INATIVAR' : 'REATIVAR'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
