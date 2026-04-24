'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateData, StudentRecordData, WeekLog } from '@/lib/types'
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
  const [record, setRecord] = useState<StudentRecordData>(
    initialRecord ?? { exercises: {}, weeklyLog: {} }
  )
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
    setRecord(r => ({
      ...r,
      exercises: { ...r.exercises, [id]: { ...getExRec(id), [field]: val } },
    }))
    setSaved(false)
  }

  function getWeek(key: string): WeekLog {
    return record.weeklyLog?.[key] ?? {
      weight: '', measurements: '', photos: '',
      perception: '', energy: '', sleep: '', notes: '',
    }
  }
  function setWeek(key: string, field: keyof WeekLog, val: string) {
    setRecord(r => ({
      ...r,
      weeklyLog: { ...r.weeklyLog, [key]: { ...getWeek(key), [field]: val } },
    }))
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

  useEffect(() => {
    if (saved) return
    const t = setTimeout(saveRecord, 30_000)
    return () => clearTimeout(t)
  }, [record, saved])

  // ── update ───────────────────────────────────────────────────────────────────
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

  // ── shared cell styles ───────────────────────────────────────────────────────
  const th: React.CSSProperties = {
    background: '#1e1e1e', color: gold, fontWeight: 700, fontSize: 9,
    letterSpacing: 0.5, padding: '7px 10px', borderRight: '1px solid #2a2a2a',
    whiteSpace: 'nowrap', textAlign: 'center',
  }
  const td: React.CSSProperties = {
    borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #1e1e1e',
    padding: '6px 8px', textAlign: 'center',
  }

  const weekFields: { label: string; key: keyof WeekLog }[] = [
    { label: 'Peso (kg)', key: 'weight' },
    { label: 'Medidas (cm)', key: 'measurements' },
    { label: 'Fotos', key: 'photos' },
    { label: 'Percepção (0-10)', key: 'perception' },
    { label: 'Energia (0-10)', key: 'energy' },
    { label: 'Sono (0-10)', key: 'sleep' },
    { label: 'Observações', key: 'notes' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── HEADER ── */}
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
          <div style={{
            fontSize: 12, fontWeight: 700, color: gold,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{template.name}</div>
          <div style={{ fontSize: 10, color: '#555' }}>{studentName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {saved && <span style={{ fontSize: 10, color: '#4dc87a' }}>✓ Salvo</span>}
          <button
            onClick={saveRecord} disabled={saving}
            style={{
              background: gold, color: '#000', border: 'none', borderRadius: 4,
              padding: '7px 16px', fontSize: 11, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '...' : 'SALVAR'}
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* ── PENDING UPDATE ── */}
      {hasPendingUpdate && (
        <div style={{
          background: 'rgba(201,160,80,0.1)', borderBottom: `1px solid ${gold}`,
          padding: '10px 14px', display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', gap: 10,
        }}>
          <span className="material-icons-outlined" style={{ color: gold, fontSize: 18, flexShrink: 0 }}>
            notification_important
          </span>
          <span style={{ fontSize: 12, color: '#e0bc74', flex: 1, minWidth: 200 }}>
            <strong>Wilson enviou uma atualização</strong> do treino (v{assignment.pending_version}).
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={acceptUpdate} disabled={acceptingUpdate} style={{
              background: gold, color: '#000', border: 'none',
              padding: '6px 16px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
              {acceptingUpdate ? '...' : 'ACEITAR'}
            </button>
            <button onClick={dismissUpdate} style={{
              background: 'transparent', color: '#888', border: '1px solid #333',
              padding: '6px 16px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
            }}>
              IGNORAR
            </button>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ overflowX: 'auto', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 14px' }}>
          {trainings.map((t, i) => (
            <button key={i} onClick={() => { setActiveTab(i); setShowWeeklyLog(false) }} style={{
              background: 'transparent', border: 'none',
              borderBottom: !showWeeklyLog && i === activeTab ? `2px solid ${t.color}` : '2px solid transparent',
              color: !showWeeklyLog && i === activeTab ? t.color : '#555',
              padding: '11px 18px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowWeeklyLog(v => !v)} style={{
            background: 'transparent', border: 'none',
            borderBottom: showWeeklyLog ? `2px solid ${gold}` : '2px solid transparent',
            color: showWeeklyLog ? gold : '#555',
            padding: '11px 18px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            REGISTRO SEMANAL
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '14px 12px', maxWidth: 1000, margin: '0 auto' }}>

        {/* ══ TRAINING TABLE ══ */}
        {!showWeeklyLog && activeTraining && (
          <>
            {/* Training title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 28, background: activeTraining.color, borderRadius: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, fontWeight: 700 }}>{activeTraining.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: activeTraining.color }}>{activeTraining.name || '—'}</div>
              </div>
            </div>

            {/* Scrollable table — sticky first two columns */}
            <div style={{
              background: '#111', border: '1px solid #222', borderRadius: 6,
              overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 560 }}>
                <thead>
                  <tr>
                    {/* Sticky columns */}
                    <th style={{ ...th, position: 'sticky', left: 0, zIndex: 2, width: 28, background: '#1e1e1e' }}>#</th>
                    <th style={{ ...th, position: 'sticky', left: 28, zIndex: 2, textAlign: 'left', minWidth: 140, background: '#1e1e1e', borderRight: '2px solid #333' }}>
                      EXERCÍCIO
                    </th>
                    {/* Scrollable columns */}
                    <th style={th}>SÉR.</th>
                    <th style={th}>REPS</th>
                    <th style={th}>CAD.</th>
                    <th style={th}>DESC.</th>
                    <th style={th}>RIR</th>
                    {/* Student annotation columns */}
                    <th style={{ ...th, background: '#1a1209', borderLeft: `2px solid ${gold}` }}>CARGA (kg)</th>
                    <th style={{ ...th, background: '#1a1209' }}>REPS REAIS</th>
                    <th style={{ ...th, background: '#1a1209' }}>ESFORÇO</th>
                    <th style={{ ...th, textAlign: 'left', minWidth: 140 }}>FOCO</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTraining.exercises.map((ex, ei) => {
                    const rec = getExRec(ex.id)
                    const rowBg = ei % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                    return (
                      <tr key={ex.id} style={{ background: rowBg }}>
                        {/* Sticky columns */}
                        <td style={{ ...td, position: 'sticky', left: 0, zIndex: 1, background: ei % 2 === 0 ? '#111' : '#131313', color: gold, fontWeight: 700 }}>
                          {ei + 1}
                        </td>
                        <td style={{ ...td, position: 'sticky', left: 28, zIndex: 1, background: ei % 2 === 0 ? '#111' : '#131313', textAlign: 'left', fontWeight: 600, borderRight: '2px solid #333' }}>
                          {ex.name}
                        </td>
                        {/* Scrollable columns */}
                        <td style={td}>{ex.series}</td>
                        <td style={td}>{ex.reps}</td>
                        <td style={td}>{ex.cadence}</td>
                        <td style={td}>{ex.rest}</td>
                        <td style={td}>{ex.rir}</td>
                        {/* Annotation inputs */}
                        <td style={{ ...td, borderLeft: `2px solid ${gold}`, background: 'rgba(201,160,80,0.05)' }}>
                          <input className="record-input" inputMode="decimal" value={rec.weight}
                            onChange={e => setExRec(ex.id, 'weight', e.target.value)} placeholder="—"
                            style={{ minWidth: 56 }} />
                        </td>
                        <td style={{ ...td, background: 'rgba(201,160,80,0.05)' }}>
                          <input className="record-input" inputMode="decimal" value={rec.realReps}
                            onChange={e => setExRec(ex.id, 'realReps', e.target.value)} placeholder="—"
                            style={{ minWidth: 56 }} />
                        </td>
                        <td style={{ ...td, background: 'rgba(201,160,80,0.05)' }}>
                          <input className="record-input" inputMode="decimal" value={rec.effort}
                            onChange={e => setExRec(ex.id, 'effort', e.target.value)} placeholder="—"
                            style={{ minWidth: 56 }} />
                        </td>
                        <td style={{ ...td, textAlign: 'left', fontSize: 10, color: '#888', minWidth: 140 }}>
                          {ex.focus}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Scroll hint on small screens */}
            <p style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 6 }}>
              ← deslize para ver mais →
            </p>
          </>
        )}

        {/* ══ WEEKLY LOG ══ */}
        {showWeeklyLog && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: gold, letterSpacing: 2 }}>REGISTRO SEMANAL</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Acompanhe sua evolução semana a semana.</div>
            </div>

            {/* One card per week — always stacked, readable on any screen */}
            {(['week1', 'week2', 'week3', 'week4'] as const).map((wk, i) => {
              const w = getWeek(wk)
              return (
                <div key={wk} style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  borderRadius: 8, marginBottom: 12, overflow: 'hidden',
                }}>
                  <div style={{
                    background: gold, color: '#000', fontWeight: 900,
                    fontSize: 10, padding: '7px 14px', letterSpacing: 1,
                  }}>
                    SEMANA {i + 1}
                  </div>
                  <div style={{
                    padding: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 12,
                  }}>
                    {weekFields.slice(0, 6).map(({ label, key }) => (
                      <div key={key}>
                        <div style={{ fontSize: 9, color: '#666', fontWeight: 600, marginBottom: 5 }}>{label}</div>
                        <input
                          className="record-input"
                          inputMode="decimal"
                          value={w[key]}
                          onChange={e => setWeek(wk, key, e.target.value)}
                          placeholder="—"
                          style={{ textAlign: 'left', fontSize: 14 }}
                        />
                      </div>
                    ))}
                    {/* Observations spans full width */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 9, color: '#666', fontWeight: 600, marginBottom: 5 }}>Observações</div>
                      <input
                        className="record-input"
                        value={w.notes}
                        onChange={e => setWeek(wk, 'notes', e.target.value)}
                        placeholder="Anotações da semana..."
                        style={{ textAlign: 'left', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
