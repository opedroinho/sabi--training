'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateData, StudentRecordData, TrainingSection } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/LogoutButton'
import { InstallPwaButton } from '@/components/InstallPwaButton'

const gold = '#c9a050'
const EMPTY_RECORD: StudentRecordData = { exercises: {}, weeklyLog: {} }

type View =
  | { type: 'dashboard' }
  | { type: 'training'; index: number }
  | { type: 'weekly' }
  | { type: 'profile' }

interface Props {
  studentName: string
  assignment: { id: string; template_id: string; current_version: number; pending_version: number | null }
  template: { id: string; name: string; version: number; data: TemplateData }
  initialRecord: StudentRecordData
}

// ─────────────────────────────────────────────────────────────────────────────
export function StudentWorkoutView({ studentName, assignment, template, initialRecord }: Props) {
  const router = useRouter()
  const d = template.data

  const [view, setView] = useState<View>({ type: 'dashboard' })
  const [record, setRecord] = useState<StudentRecordData>(initialRecord ?? EMPTY_RECORD)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [acceptingUpdate, setAcceptingUpdate] = useState(false)

  const hasPendingUpdate = assignment.pending_version !== null

  // ── record helpers ──────────────────────────────────────────────────────────
  function getExRec(id: string) {
    return record.exercises?.[id] ?? { weight: '', realReps: '', effort: '' }
  }
  function setExRec(id: string, field: string, val: string) {
    setRecord(r => ({ ...r, exercises: { ...r.exercises, [id]: { ...getExRec(id), [field]: val } } }))
    setSaved(false)
  }
  function getWeek(key: string) {
    return record.weeklyLog?.[key] ?? { weight: '', measurements: '', perception: '', energy: '', sleep: '', notes: '' }
  }
  function setWeek(key: string, field: string, val: string) {
    setRecord(r => ({ ...r, weeklyLog: { ...r.weeklyLog, [key]: { ...getWeek(key), [field]: val } } }))
    setSaved(false)
  }

  // ── save ────────────────────────────────────────────────────────────────────
  async function saveRecord(rec = record) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('student_records').upsert({
      assignment_id: assignment.id,
      student_id: user!.id,
      data: rec,
    })
    setSaving(false)
    setSaved(true)
  }

  // auto-save 15s after last change
  useEffect(() => {
    if (saved) return
    const t = setTimeout(() => saveRecord(), 15_000)
    return () => clearTimeout(t)
  }, [record, saved])

  // save when leaving a training view
  function navigate(v: View) {
    if (!saved && view.type === 'training') saveRecord()
    setView(v)
  }

  // ── update banner ───────────────────────────────────────────────────────────
  async function acceptUpdate() {
    setAcceptingUpdate(true)
    const supabase = createClient()
    await supabase.from('assignments')
      .update({ current_version: assignment.pending_version, pending_version: null })
      .eq('id', assignment.id)
    setAcceptingUpdate(false)
    router.refresh()
  }
  async function dismissUpdate() {
    const supabase = createClient()
    await supabase.from('assignments').update({ pending_version: null }).eq('id', assignment.id)
    router.refresh()
  }

  // ── view label ──────────────────────────────────────────────────────────────
  function viewLabel() {
    if (view.type === 'training') {
      const t = d.trainings[view.index]
      return t ? `${t.label}` : 'Treino'
    }
    if (view.type === 'weekly') return 'Registro Semanal'
    if (view.type === 'profile') return 'Meu Perfil'
    return 'Meus Treinos'
  }
  function viewSub() {
    if (view.type === 'training') return d.trainings[view.index]?.name ?? ''
    if (view.type === 'dashboard') return `Olá, ${studentName} 👋`
    return ''
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: '#111', borderBottom: `2px solid ${gold}`,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {view.type !== 'dashboard' ? (
            <button
              onClick={() => navigate({ type: 'dashboard' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#888', flexShrink: 0 }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
          ) : (
            <span style={{ fontSize: 18, fontWeight: 900, color: gold, border: `2px solid ${gold}`, padding: '2px 7px', borderRadius: 4, letterSpacing: -1, flexShrink: 0 }}>WS</span>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: gold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {viewLabel()}
            </div>
            {viewSub() && (
              <div style={{ fontSize: 10, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {viewSub()}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {view.type === 'training' && (
              <>
                {saving && <span style={{ fontSize: 10, color: '#888' }}>salvando...</span>}
                {saved && !saving && <span style={{ fontSize: 10, color: '#4dc87a' }}>✓ salvo</span>}
                <button
                  onClick={() => saveRecord()}
                  disabled={saving || saved}
                  style={{
                    background: saved ? 'transparent' : gold,
                    color: saved ? '#4dc87a' : '#000',
                    border: saved ? '1px solid #2a4a2a' : 'none',
                    padding: '6px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                    cursor: (saving || saved) ? 'default' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? '...' : saved ? 'SALVO ✓' : 'SALVAR'}
                </button>
              </>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* ── PENDING UPDATE BANNER ──────────────────────────────────────── */}
        {hasPendingUpdate && (
          <div style={{
            background: 'rgba(201,160,80,0.08)', borderBottom: `1px solid ${gold}`,
            padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="material-icons-outlined" style={{ color: gold, fontSize: 18, flexShrink: 0 }}>notification_important</span>
              <span style={{ fontSize: 12, color: '#e0bc74' }}>
                <strong>Wilson atualizou seu treino</strong> — versão {assignment.pending_version} disponível.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={acceptUpdate} disabled={acceptingUpdate} style={{ flex: 1, background: gold, color: '#000', border: 'none', padding: '10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {acceptingUpdate ? 'ATUALIZANDO...' : 'ACEITAR ATUALIZAÇÃO'}
              </button>
              <button onClick={dismissUpdate} style={{ background: 'transparent', color: '#666', border: '1px solid #333', padding: '10px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                IGNORAR
              </button>
            </div>
          </div>
        )}

        {/* ── VIEWS ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 14px 60px' }}>
          {view.type === 'dashboard' && (
            <DashboardView
              d={d}
              onSelectTraining={i => navigate({ type: 'training', index: i })}
              onOpenWeekly={() => navigate({ type: 'weekly' })}
              onOpenProfile={() => navigate({ type: 'profile' })}
            />
          )}
          {view.type === 'training' && (
            <TrainingView
              training={d.trainings[view.index]}
              d={d}
              getExRec={getExRec}
              setExRec={setExRec}
            />
          )}
          {view.type === 'weekly' && (
            <WeeklyView getWeek={getWeek} setWeek={setWeek} onSave={saveRecord} saving={saving} saved={saved} />
          )}
          {view.type === 'profile' && (
            <ProfileView d={d} />
          )}
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function DashboardView({ d, onSelectTraining, onOpenWeekly, onOpenProfile }: {
  d: TemplateData
  onSelectTraining: (i: number) => void
  onOpenWeekly: () => void
  onOpenProfile: () => void
}) {
  const trainingColors = d.trainings.map(t => t.color)

  return (
    <div>
      {/* Profile button */}
      <button
        onClick={onOpenProfile}
        style={{
          width: '100%', background: '#111', border: '1px solid #222',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span className="material-icons-outlined" style={{ fontSize: 22, color: '#555' }}>account_circle</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8e8' }}>Meu Perfil</div>
          <div style={{ fontSize: 10, color: '#555' }}>Dados e informações do seu treino</div>
        </div>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: '#444' }}>chevron_right</span>
      </button>

      {/* Training structure summary */}
      {(d.trainingStructure.division || d.trainingStructure.weeklyFrequency || d.trainingStructure.restBetweenSeries || d.trainingStructure.timeUnderTension) && (
        <div style={{ background: '#111', border: `1px solid #222`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555', marginBottom: 12 }}>ESTRUTURA DO TREINO</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'DIVISÃO', val: d.trainingStructure.division },
              { label: 'FREQUÊNCIA', val: d.trainingStructure.weeklyFrequency },
              { label: 'DESCANSO', val: d.trainingStructure.restBetweenSeries },
              { label: 'TEMPO SOB TENSÃO', val: d.trainingStructure.timeUnderTension },
            ].filter(x => x.val).map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: 8.5, color: '#555', letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training cards */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555', marginBottom: 12 }}>
        ESCOLHA SEU TREINO DE HOJE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {d.trainings.map((t, i) => (
          <button
            key={i}
            onClick={() => onSelectTraining(i)}
            style={{
              background: '#111', border: `1px solid #222`,
              borderLeft: `4px solid ${t.color}`,
              borderRadius: 10, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 24, color: t.color, flexShrink: 0 }}>fitness_center</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: t.color, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.name || '—'}
              </div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>
                {t.exercises.filter(e => e.name).length} exercício{t.exercises.filter(e => e.name).length !== 1 ? 's' : ''}
              </div>
            </div>
            <span className="material-icons-outlined" style={{ fontSize: 22, color: '#333', flexShrink: 0 }}>chevron_right</span>
          </button>
        ))}
      </div>

      {/* Install PWA */}
      <InstallPwaButton />

      {/* Weekly log button */}
      <button
        onClick={onOpenWeekly}
        style={{
          width: '100%', background: '#111', border: '1px solid #222',
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span className="material-icons-outlined" style={{ fontSize: 22, color: '#555', flexShrink: 0 }}>bar_chart</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8e8' }}>Registro Semanal</div>
          <div style={{ fontSize: 10, color: '#555' }}>Peso, medidas, percepção e evolução</div>
        </div>
        <span className="material-icons-outlined" style={{ fontSize: 22, color: '#333', flexShrink: 0 }}>chevron_right</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING VIEW
// ─────────────────────────────────────────────────────────────────────────────
function TrainingView({ training, d, getExRec, setExRec }: {
  training: TrainingSection
  d: TemplateData
  getExRec: (id: string) => { weight: string; realReps: string; effort: string }
  setExRec: (id: string, field: string, val: string) => void
}) {
  const exercises = training.exercises.filter(e => e.name)

  return (
    <div>
      {/* Exercises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {exercises.map((ex, ei) => {
          const rec = getExRec(ex.id)
          return (
            <div key={ex.id} style={{
              background: '#111', border: '1px solid #222',
              borderLeft: `3px solid ${training.color}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Exercise info */}
              <div style={{ padding: '14px 16px 10px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: `${training.color}22`,
                    color: training.color, fontWeight: 900, fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>
                    {ei + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3 }}>{ex.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {ex.series && (
                        <Pill icon="repeat" text={`${ex.series} séries`} color={training.color} />
                      )}
                      {ex.reps && (
                        <Pill icon="tag" text={`${ex.reps} reps`} color={training.color} />
                      )}
                      {ex.rest && (
                        <Pill icon="timer" text={`${ex.rest} descanso`} color="#555" />
                      )}
                    </div>
                    {ex.focus && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#888', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {ex.focus}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Record inputs */}
              <div style={{
                borderTop: '1px solid #1e1e1e',
                background: '#0e0e0e',
                padding: '10px 16px',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              }}>
                {[
                  { key: 'weight', label: 'CARGA (KG)', val: rec.weight },
                  { key: 'realReps', label: 'REPS REAIS', val: rec.realReps },
                  { key: 'effort', label: 'ESFORÇO (0-10)', val: rec.effort },
                ].map(({ key, label, val }) => (
                  <div key={key}>
                    <div style={{ fontSize: 8, color: '#555', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                    <input
                      className="record-input"
                      value={val}
                      onChange={e => setExRec(ex.id, key, e.target.value)}
                      placeholder="—"
                      inputMode="decimal"
                      style={{ width: '100%', fontSize: 15, textAlign: 'center', padding: '8px 6px', borderRadius: 6 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12 }}>
            Nenhum exercício cadastrado neste treino.
          </div>
        )}
      </div>

      {/* ── Supplementary sections (collapsed by default) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {d.progression.some(Boolean) && (
          <CollapsibleSection title="Progressão" icon="trending_up">
            {d.progression.filter(Boolean).map((item, i) => (
              <BulletItem key={i} text={item} />
            ))}
          </CollapsibleSection>
        )}
        {(d.cardio.frequency || d.cardio.duration || d.cardio.modality || d.cardio.intensity || d.cardio.note) && (
          <CollapsibleSection title="Cardio" icon="favorite">
            {[
              { label: 'Frequência', val: d.cardio.frequency },
              { label: 'Duração', val: d.cardio.duration },
              { label: 'Intensidade', val: d.cardio.intensity },
              { label: 'Modalidade', val: d.cardio.modality },
              { label: 'Nota', val: d.cardio.note },
            ].filter(x => x.val).map(({ label, val }) => (
              <InfoRow key={label} label={label} value={val} />
            ))}
          </CollapsibleSection>
        )}
        {d.warmup.some(Boolean) && (
          <CollapsibleSection title="Aquecimento" icon="local_fire_department">
            {d.warmup.filter(Boolean).map((item, i) => (
              <BulletItem key={i} text={item} />
            ))}
          </CollapsibleSection>
        )}
        {d.extraInstructions.some(Boolean) && (
          <CollapsibleSection title="Instruções Extras" icon="star">
            {d.extraInstructions.filter(Boolean).map((item, i) => (
              <BulletItem key={i} text={item} />
            ))}
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY LOG VIEW
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyView({ getWeek, setWeek, onSave, saving, saved }: {
  getWeek: (k: string) => { weight: string; measurements: string; perception: string; energy: string; sleep: string; notes: string }
  setWeek: (k: string, f: string, v: string) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}) {
  const weeks = [
    { key: 'week1', label: 'Semana 1' },
    { key: 'week2', label: 'Semana 2' },
    { key: 'week3', label: 'Semana 3' },
    { key: 'week4', label: 'Semana 4' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>ACOMPANHAMENTO SEMANAL</div>
        <button
          onClick={onSave}
          disabled={saving || saved}
          style={{
            background: saved ? 'transparent' : gold, color: saved ? '#4dc87a' : '#000',
            border: saved ? '1px solid #2a4a2a' : 'none',
            padding: '6px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
            cursor: (saving || saved) ? 'default' : 'pointer',
          }}
        >
          {saving ? 'SALVANDO...' : saved ? 'SALVO ✓' : 'SALVAR'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {weeks.map(({ key, label }) => {
          const w = getWeek(key)
          return (
            <div key={key} style={{ background: '#111', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: `${gold}18`, borderBottom: `1px solid ${gold}44`, padding: '10px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: gold, letterSpacing: 1 }}>{label.toUpperCase()}</div>
              </div>
              <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'weight', label: 'Peso (kg)', inputMode: 'decimal' as const },
                  { key: 'measurements', label: 'Medidas (cm)', inputMode: 'text' as const },
                  { key: 'perception', label: 'Percepção (0-10)', inputMode: 'decimal' as const },
                  { key: 'energy', label: 'Energia (0-10)', inputMode: 'decimal' as const },
                  { key: 'sleep', label: 'Sono (0-10)', inputMode: 'decimal' as const },
                ].map(({ key: f, label: lbl, inputMode }) => (
                  <div key={f}>
                    <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{lbl.toUpperCase()}</div>
                    <input
                      className="record-input"
                      value={(w as Record<string, string>)[f] ?? ''}
                      onChange={e => setWeek(key, f, e.target.value)}
                      inputMode={inputMode}
                      placeholder="—"
                      style={{ width: '100%', fontSize: 15, textAlign: 'center', padding: '8px 6px', borderRadius: 6 }}
                    />
                  </div>
                ))}
                {/* Notes spans full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>OBSERVAÇÕES</div>
                  <textarea
                    value={(w as Record<string, string>)['notes'] ?? ''}
                    onChange={e => setWeek(key, 'notes', e.target.value)}
                    placeholder="Como foi a semana?"
                    rows={2}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
                      color: '#e8e8e8', fontSize: 13, padding: '8px 10px', resize: 'vertical',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = gold)}
                    onBlur={e => (e.target.style.borderColor = '#333')}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ProfileView({ d }: { d: TemplateData }) {
  const fields = [
    { label: 'Nome', key: 'name' },
    { label: 'Idade', key: 'age' },
    { label: 'Altura / Peso', key: 'heightWeight' },
    { label: 'Objetivo principal', key: 'mainGoal' },
    { label: 'Nível', key: 'level' },
    { label: 'Lesões / dores', key: 'injuries' },
    { label: 'Dias disponíveis', key: 'availableDays' },
    { label: 'Tempo por treino', key: 'sessionTime' },
  ].filter(({ key }) => (d.studentInfo as Record<string, string>)[key])

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555', marginBottom: 14 }}>INFORMAÇÕES DO ALUNO</div>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
        {fields.map(({ label, key }, i) => (
          <div key={key} style={{
            padding: '13px 18px', borderBottom: i < fields.length - 1 ? '1px solid #1a1a1a' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8e8', textAlign: 'right' }}>
              {(d.studentInfo as Record<string, string>)[key]}
            </span>
          </div>
        ))}
        {fields.length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#444', fontSize: 12 }}>
            Nenhuma informação preenchida ainda.
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Pill({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 20, padding: '3px 8px',
      fontSize: 10, fontWeight: 700, color,
    }}>
      <span className="material-icons-outlined" style={{ fontSize: 11 }}>{icon}</span>
      {text}
    </span>
  )
}

function CollapsibleSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        }}
      >
        <span className="material-icons-outlined" style={{ fontSize: 17, color: '#555' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#888' }}>{title}</span>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: '#444', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ paddingTop: 12 }}>{children}</div>
        </div>
      )}
    </div>
  )
}

function BulletItem({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #1a1a1a', alignItems: 'flex-start' }}>
      <span style={{ color: gold, fontWeight: 700, fontSize: 9, marginTop: 2, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 12, color: '#bbb', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a1a', gap: 10 }}>
      <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e8e8' }}>{value}</span>
    </div>
  )
}
