'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateData, StudentRecordData } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/LogoutButton'

const gold = '#c9a050'

interface Props {
  studentName: string
  assignment: { id: string; template_id: string; current_version: number; pending_version: number | null }
  template: { id: string; name: string; version: number; data: TemplateData }
  initialRecord: StudentRecordData
}

export function StudentWorkoutView({ studentName, assignment, template, initialRecord }: Props) {
  const router = useRouter()
  const [record, setRecord] = useState<StudentRecordData>(initialRecord ?? { exercises: {}, weeklyLog: {} })
  const [activeTab, setActiveTab] = useState(0)
  const [showWeeklyLog, setShowWeeklyLog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [acceptingUpdate, setAcceptingUpdate] = useState(false)

  const data = template.data
  const trainings = data.trainings
  const activeTraining = trainings[activeTab]
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
    return record.weeklyLog?.[key] ?? { weight: '', measurements: '', photos: '', perception: '', energy: '', sleep: '', notes: '' }
  }
  function setWeek(key: string, field: string, val: string) {
    setRecord(r => ({ ...r, weeklyLog: { ...r.weeklyLog, [key]: { ...getWeek(key), [field]: val } } }))
    setSaved(false)
  }

  // ── save ─────────────────────────────────────────────────────────────────────
  async function saveRecord() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('student_records').upsert({
      assignment_id: assignment.id,
      student_id: user!.id,
      data: record,
    })
    setSaving(false)
    setSaved(true)
  }

  // Auto-save every 30s when there are unsaved changes
  useEffect(() => {
    if (saved) return
    const t = setTimeout(saveRecord, 30_000)
    return () => clearTimeout(t)
  }, [record, saved])

  // ── update accept/dismiss ───────────────────────────────────────────────────
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

  // ── shared styles ───────────────────────────────────────────────────────────
  const cellStyle = { borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #1e1e1e', padding: '5px 8px' }
  const thStyle: React.CSSProperties = {
    background: '#1e1e1e', color: gold, fontWeight: 700, fontSize: 9,
    letterSpacing: 0.5, padding: '6px 8px', borderRight: '1px solid #2a2a2a',
    whiteSpace: 'nowrap', textAlign: 'center',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── STICKY HEADER ── */}
      <div id="save-bar" style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#111', borderBottom: `2px solid ${gold}`,
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontSize: 18, fontWeight: 900, color: gold, border: `2px solid ${gold}`,
          padding: '2px 7px', borderRadius: 4, letterSpacing: -1, flexShrink: 0,
        }}>WS</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: gold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {template.name}
          </div>
          <div style={{ fontSize: 10, color: '#555' }}>{studentName}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {saved && <span style={{ fontSize: 10, color: '#4dc87a' }}>✓ Salvo</span>}
          <button
            onClick={saveRecord} disabled={saving}
            style={{
              background: gold, color: '#000', border: 'none', borderRadius: 4,
              padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '...' : 'SALVAR'}
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* ── PENDING UPDATE BANNER ── */}
      {hasPendingUpdate && (
        <div style={{ background: 'rgba(201,160,80,0.1)', borderBottom: `1px solid ${gold}`, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="material-icons-outlined" style={{ color: gold, fontSize: 18, flexShrink: 0 }}>notification_important</span>
            <span style={{ fontSize: 12, color: '#e0bc74', flex: 1 }}>
              <strong>Wilson enviou uma atualização</strong> do treino (v{assignment.pending_version}).
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={acceptUpdate} disabled={acceptingUpdate} style={{ background: gold, color: '#000', border: 'none', padding: '5px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {acceptingUpdate ? '...' : 'ACEITAR'}
              </button>
              <button onClick={dismissUpdate} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '5px 14px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                IGNORAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div style={{ overflowX: 'auto', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 14px' }}>
          {trainings.map((t, i) => (
            <button key={i} onClick={() => { setActiveTab(i); setShowWeeklyLog(false) }} style={{
              background: 'transparent', border: 'none',
              borderBottom: !showWeeklyLog && i === activeTab ? `2px solid ${t.color}` : '2px solid transparent',
              color: !showWeeklyLog && i === activeTab ? t.color : '#555',
              padding: '11px 16px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowWeeklyLog(v => !v)} style={{
            background: 'transparent', border: 'none',
            borderBottom: showWeeklyLog ? `2px solid ${gold}` : '2px solid transparent',
            color: showWeeklyLog ? gold : '#555',
            padding: '11px 16px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            REGISTRO SEMANAL
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 12px' }}>

        {/* ══ TRAINING VIEW ══ */}
        {!showWeeklyLog && activeTraining && (
          <>
            {/* Training title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 30, background: activeTraining.color, borderRadius: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, fontWeight: 700 }}>{activeTraining.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: activeTraining.color }}>{activeTraining.name || '—'}</div>
              </div>
            </div>

            {/* ── MOBILE: exercise cards ── */}
            <div className="student-cards">
              {activeTraining.exercises.filter(ex => ex.name).map((ex, ei) => {
                const rec = getExRec(ex.id)
                const chips = [
                  { label: 'Séries', val: ex.series },
                  { label: 'Reps', val: ex.reps },
                  { label: 'Desc', val: ex.rest },
                  { label: 'RIR', val: ex.rir },
                  { label: 'Cad', val: ex.cadence },
                ].filter(c => c.val)

                return (
                  <div key={ex.id} style={{
                    background: '#111', borderRadius: 8, marginBottom: 8, overflow: 'hidden',
                    border: '1px solid #1e1e1e', borderLeft: `3px solid ${activeTraining.color}`,
                  }}>
                    {/* name row */}
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        background: activeTraining.color, color: '#000', fontWeight: 900,
                        fontSize: 10, width: 22, height: 22, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{ei + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{ex.name}</span>
                    </div>

                    {/* info chips */}
                    {chips.length > 0 && (
                      <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {chips.map(c => (
                          <span key={c.label} style={{
                            background: '#1a1a1a', border: '1px solid #2a2a2a',
                            borderRadius: 4, padding: '3px 8px', fontSize: 10,
                          }}>
                            <span style={{ color: '#555' }}>{c.label}: </span>
                            <span style={{ color: '#ddd', fontWeight: 600 }}>{c.val}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* focus note */}
                    {ex.focus && (
                      <div style={{ padding: '0 12px 8px', fontSize: 10, color: '#888', fontStyle: 'italic' }}>
                        🎯 {ex.focus}
                      </div>
                    )}

                    {/* annotation inputs */}
                    <div style={{
                      background: 'rgba(201,160,80,0.03)', borderTop: '1px solid #1a1a1a',
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    }}>
                      {[
                        { label: 'CARGA (kg)', field: 'weight', val: rec.weight },
                        { label: 'REPS REAIS', field: 'realReps', val: rec.realReps },
                        { label: 'ESFORÇO (0-10)', field: 'effort', val: rec.effort },
                      ].map(({ label, field, val }, idx) => (
                        <div key={field} style={{
                          padding: '8px 10px', textAlign: 'center',
                          borderRight: idx < 2 ? '1px solid #1a1a1a' : 'none',
                        }}>
                          <div style={{ fontSize: 8, color: '#555', letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
                          <input
                            className="record-input"
                            type="text" inputMode="decimal"
                            value={val}
                            onChange={e => setExRec(ex.id, field, e.target.value)}
                            placeholder="—"
                            style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', width: '100%' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {activeTraining.exercises.filter(ex => ex.name).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12 }}>
                  Nenhum exercício cadastrado neste treino.
                </div>
              )}
            </div>

            {/* ── DESKTOP: exercise table ── */}
            <div className="student-table">
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 28 }}>#</th>
                        <th style={{ ...thStyle, textAlign: 'left', minWidth: 180 }}>EXERCÍCIO</th>
                        <th style={thStyle}>SÉRIES</th>
                        <th style={thStyle}>REPS</th>
                        <th style={thStyle}>CADÊNCIA</th>
                        <th style={thStyle}>DESCANSO</th>
                        <th style={thStyle}>RIR</th>
                        <th style={{ ...thStyle, background: '#1a1209', borderLeft: `2px solid ${gold}` }}>CARGA (KG)</th>
                        <th style={{ ...thStyle, background: '#1a1209' }}>REPS REAIS</th>
                        <th style={{ ...thStyle, background: '#1a1209' }}>ESFORÇO (0-10)</th>
                        <th style={{ ...thStyle, textAlign: 'left', minWidth: 160 }}>EXECUÇÃO / FOCO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTraining.exercises.map((ex, ei) => {
                        const rec = getExRec(ex.id)
                        return (
                          <tr key={ex.id} style={{ background: ei % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ ...cellStyle, color: gold, fontWeight: 700, textAlign: 'center' }}>{ei + 1}</td>
                            <td style={{ ...cellStyle, fontWeight: 600 }}>{ex.name}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{ex.series}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{ex.reps}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{ex.cadence}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{ex.rest}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{ex.rir}</td>
                            <td style={{ ...cellStyle, borderLeft: `2px solid ${gold}`, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                              <input className="record-input" type="text" inputMode="decimal" value={rec.weight} onChange={e => setExRec(ex.id, 'weight', e.target.value)} placeholder="—" />
                            </td>
                            <td style={{ ...cellStyle, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                              <input className="record-input" type="text" inputMode="decimal" value={rec.realReps} onChange={e => setExRec(ex.id, 'realReps', e.target.value)} placeholder="—" />
                            </td>
                            <td style={{ ...cellStyle, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                              <input className="record-input" type="text" inputMode="decimal" value={rec.effort} onChange={e => setExRec(ex.id, 'effort', e.target.value)} placeholder="—" />
                            </td>
                            <td style={{ ...cellStyle, fontSize: 10, color: '#888' }}>{ex.focus}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ WEEKLY LOG ══ */}
        {showWeeklyLog && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: gold, letterSpacing: 2 }}>REGISTRO SEMANAL</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Acompanhe sua evolução semana a semana.</div>
            </div>

            {/* Mobile: stacked cards per week */}
            <div className="student-cards">
              {(['week1', 'week2', 'week3', 'week4'] as const).map((wk, i) => {
                const w = getWeek(wk) as Record<string, string>
                return (
                  <div key={wk} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ background: gold, color: '#000', fontWeight: 900, fontSize: 10, padding: '6px 14px', letterSpacing: 1 }}>
                      SEMANA {i + 1}
                    </div>
                    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Peso (kg)', field: 'weight' },
                        { label: 'Medidas (cm)', field: 'measurements' },
                        { label: 'Fotos', field: 'photos' },
                        { label: 'Percepção (0-10)', field: 'perception' },
                        { label: 'Energia (0-10)', field: 'energy' },
                        { label: 'Sono (0-10)', field: 'sleep' },
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <div style={{ fontSize: 9, color: '#555', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                          <input
                            className="record-input"
                            type="text" inputMode="decimal"
                            value={w[field]}
                            onChange={e => setWeek(wk, field, e.target.value)}
                            placeholder="—"
                            style={{ textAlign: 'left', fontSize: 14 }}
                          />
                        </div>
                      ))}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 9, color: '#555', marginBottom: 4, fontWeight: 600 }}>Observações</div>
                        <input
                          className="record-input"
                          value={w.notes}
                          onChange={e => setWeek(wk, 'notes', e.target.value)}
                          placeholder="Anotações livres da semana..."
                          style={{ textAlign: 'left', fontSize: 13 }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: horizontal table */}
            <div className="student-table">
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['SEMANA', 'PESO (KG)', 'MEDIDAS (CM)', 'FOTOS', 'PERCEPÇÃO (0-10)', 'ENERGIA (0-10)', 'SONO (0-10)', 'OBSERVAÇÕES'].map((h, i) => (
                          <th key={i} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(['week1', 'week2', 'week3', 'week4'] as const).map((wk, i) => {
                        const w = getWeek(wk) as Record<string, string>
                        return (
                          <tr key={wk} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ ...cellStyle, color: gold, fontWeight: 700, background: '#161616', whiteSpace: 'nowrap', paddingLeft: 14 }}>
                              Semana {i + 1}
                            </td>
                            {(['weight', 'measurements', 'photos', 'perception', 'energy', 'sleep', 'notes'] as const).map(f => (
                              <td key={f} style={{ ...cellStyle, textAlign: 'center' }}>
                                <input className="record-input" value={w[f]} onChange={e => setWeek(wk, f, e.target.value)} placeholder="—" />
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
