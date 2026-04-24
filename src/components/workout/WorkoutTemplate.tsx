'use client'

import { TemplateData, StudentRecordData, Exercise } from '@/lib/types'

// ── small helpers ──────────────────────────────────────────────────────────
function FI({
  value, onChange, placeholder, readOnly, className = '', style = {},
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      className={`field-input ${className}`}
      style={style}
      value={value}
      placeholder={readOnly ? '' : (placeholder ?? '')}
      readOnly={readOnly}
      onChange={e => onChange?.(e.target.value)}
    />
  )
}

function RI({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      className="record-input"
      value={value}
      placeholder={placeholder ?? '—'}
      onChange={e => onChange(e.target.value)}
    />
  )
}

const MI = ({ name, style }: { name: string; style?: React.CSSProperties }) => (
  <span className="material-icons-outlined" style={{ fontSize: 15, verticalAlign: 'middle', ...style }}>
    {name}
  </span>
)

// ── main component ─────────────────────────────────────────────────────────
interface Props {
  data: TemplateData
  record: StudentRecordData
  readOnly: boolean          // true = student view (template fields locked)
  onDataChange?: (d: TemplateData) => void
  onRecordChange?: (r: StudentRecordData) => void
}

export function WorkoutTemplate({ data, record, readOnly, onDataChange, onRecordChange }: Props) {
  function setData(patch: Partial<TemplateData>) {
    onDataChange?.({ ...data, ...patch })
  }
  function setRecord(patch: Partial<StudentRecordData>) {
    onRecordChange?.({ ...record, ...patch })
  }

  // ── exercise record helpers ──
  function getExRec(id: string) {
    return record.exercises?.[id] ?? { weight: '', realReps: '', effort: '' }
  }
  function setExRec(id: string, field: string, val: string) {
    setRecord({
      exercises: { ...record.exercises, [id]: { ...getExRec(id), [field]: val } },
    })
  }

  // ── training mutation helpers ──
  const TRAINING_COLORS = ['#c9a050', '#4da6c8', '#4dc87a', '#c84da6', '#c84d4d', '#a64dc8', '#c8a44d', '#4dc8c8']
  const TRAINING_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  function addTraining() {
    const idx = data.trainings.length
    const letter = TRAINING_LETTERS[idx] ?? String(idx + 1)
    const color = TRAINING_COLORS[idx % TRAINING_COLORS.length]
    const newTraining = {
      label: `TREINO ${letter}`,
      name: '',
      color,
      exercises: Array.from({ length: 5 }, (_, i) => ({
        id: `${letter.toLowerCase()}${Date.now()}${i}`,
        name: '', series: '', reps: '', cadence: '', rest: '', rir: '', focus: '',
      })),
    }
    setData({ trainings: [...data.trainings, newTraining] })
  }

  function deleteTraining(ti: number) {
    if (!confirm(`Remover "${data.trainings[ti].label}"?`)) return
    setData({ trainings: data.trainings.filter((_, i) => i !== ti) })
  }

  function addExercise(ti: number) {
    const ts = data.trainings.map((t, i) => {
      if (i !== ti) return t
      const letter = t.label.split(' ')[1]?.toLowerCase() ?? 't'
      const newEx = { id: `${letter}${Date.now()}`, name: '', series: '', reps: '', cadence: '', rest: '', rir: '', focus: '' }
      return { ...t, exercises: [...t.exercises, newEx] }
    })
    setData({ trainings: ts })
  }

  function deleteExercise(ti: number, ei: number) {
    const ts = data.trainings.map((t, i) => {
      if (i !== ti) return t
      return { ...t, exercises: t.exercises.filter((_, j) => j !== ei) }
    })
    setData({ trainings: ts })
  }

  // ── week log helpers ──
  function getWeek(key: string) {
    const empty = { weight: '', measurements: '', photos: '', perception: '', energy: '', sleep: '', notes: '' }
    return record.weeklyLog?.[key] ?? empty
  }
  function setWeek(key: string, field: string, val: string) {
    setRecord({
      weeklyLog: { ...record.weeklyLog, [key]: { ...getWeek(key), [field]: val } },
    })
  }

  const gold = '#c9a050'
  const cell = { borderRight: '1px solid #333', borderBottom: '1px solid #1e1e1e', padding: '4px 5px' }
  const thStyle: React.CSSProperties = {
    background: '#252525', color: gold, fontWeight: 700, fontSize: 9,
    letterSpacing: 0.5, padding: '5px 6px', borderRight: '1px solid #333',
    whiteSpace: 'nowrap' as const, textAlign: 'center' as const,
  }

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 11, color: '#e8e8e8', lineHeight: 1.4 }}>

      {/* ── HEADER ── */}
      <div style={{
        background: '#111', border: '1px solid #c9a050', borderRadius: 6,
        padding: '14px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', gap: 16, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: gold, border: `2px solid ${gold}`, padding: '4px 10px', borderRadius: 4, letterSpacing: -2 }}>WS</div>
          <div>
            <div style={{ color: gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>WILSON SABIÁ</div>
            <div style={{ color: '#888', fontSize: 9, letterSpacing: 2 }}>PERSONAL TRAINER</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: gold, letterSpacing: 3, lineHeight: 1.1 }}>
            PLANILHA DE TREINO<br />CONSULTORIA PREMIUM
          </div>
          <div style={{ fontSize: 10, color: '#888', letterSpacing: 4, marginTop: 4 }}>
            ESTRATÉGIA • PERFORMANCE • RESULTADOS
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <MI name="fitness_center" style={{ fontSize: 30, color: gold }} />
          <div style={{ fontSize: 10, color: '#e0bc74', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.4 }}>
            "DISCIPLINA HOJE,<br />RESULTADOS AMANHÃ."
          </div>
          <div style={{ fontSize: 9, color: '#888' }}><em>Seja sua melhor versão.</em></div>
        </div>
      </div>

      {/* ── TOP 3-COL ── */}
      <div className="ws-grid-3">
        {/* 1. Dados do Aluno */}
        <Card num="1" title="DADOS DO ALUNO">
          {[
            { label: 'Nome:', key: 'name', placeholder: 'Nome completo' },
            { label: 'Idade:', key: 'age', placeholder: 'Idade' },
            { label: 'Altura / Peso:', key: 'heightWeight', placeholder: 'Altura / Peso' },
            { label: 'Objetivo principal:', key: 'mainGoal', placeholder: 'Objetivo' },
            { label: 'Nível:', key: 'level', placeholder: 'Nível' },
            { label: 'Tempo de treino:', key: 'trainingTime', placeholder: 'Tempo de treino' },
            { label: 'Lesões / dores:', key: 'injuries', placeholder: 'Lesões ou dores' },
            { label: 'Dias disponíveis:', key: 'availableDays', placeholder: 'Dias disponíveis' },
            { label: 'Tempo por treino:', key: 'sessionTime', placeholder: 'Duração do treino' },
          ].map(({ label, key, placeholder }) => (
            <FieldRow key={key} label={label}>
              <FI
                value={(data.studentInfo as Record<string, string>)[key]}
                onChange={v => setData({ studentInfo: { ...data.studentInfo, [key]: v } })}
                placeholder={placeholder}
                readOnly={readOnly}
              />
            </FieldRow>
          ))}
        </Card>

        {/* 2. Estrutura do Treino */}
        <Card num="2" title="ESTRUTURA DO TREINO">
          {[
            { icon: 'folder_open', label: 'Divisão:', key: 'division' },
            { icon: 'calendar_today', label: 'Frequência semanal:', key: 'weeklyFrequency' },
            { icon: 'track_changes', label: 'Estratégia:', key: 'strategy' },
            { icon: 'settings', label: 'Método:', key: 'method' },
            { icon: 'timer', label: 'Descanso entre séries:', key: 'restBetweenSeries' },
            { icon: 'schedule', label: 'Tempo sob tensão:', key: 'timeUnderTension' },
          ].map(({ icon, label, key }) => (
            <FieldRow key={key} label={<><MI name={icon} style={{ color: gold, marginRight: 3 }} />{label}</>}>
              <FI
                value={(data.trainingStructure as Record<string, string>)[key]}
                onChange={v => setData({ trainingStructure: { ...data.trainingStructure, [key]: v } })}
                readOnly={readOnly}
              />
            </FieldRow>
          ))}
        </Card>

        {/* 3. Periodização */}
        <Card num="3" title="PERIODIZAÇÃO (MICROCICLO 4 SEMANAS)">
          {data.periodization.weeks.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1e1e1e', padding: '5px 0' }}>
              <div style={{ background: gold, color: '#000', fontWeight: 900, fontSize: 8.5, padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap', minWidth: 62, textAlign: 'center' }}>
                {w.badge}
              </div>
              <div style={{ flex: 1 }}>
                <FI value={w.title} onChange={v => { const weeks = [...data.periodization.weeks]; weeks[i] = { ...w, title: v }; setData({ periodization: { ...data.periodization, weeks } }) }} placeholder="Título" readOnly={readOnly} style={{ color: '#e0bc74', fontWeight: 700, fontSize: 9.5 }} />
                <FI value={w.desc} onChange={v => { const weeks = [...data.periodization.weeks]; weeks[i] = { ...w, desc: v }; setData({ periodization: { ...data.periodization, weeks } }) }} placeholder="Descrição" readOnly={readOnly} style={{ color: '#888', fontSize: 9 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, background: '#1a1209', borderLeft: `3px solid ${gold}`, padding: '5px 8px', borderRadius: '0 3px 3px 0' }}>
            <FI value={data.periodization.note} onChange={v => setData({ periodization: { ...data.periodization, note: v } })} placeholder="Nota pós-ciclo" readOnly={readOnly} style={{ fontSize: 9, color: '#888' }} />
          </div>
        </Card>
      </div>

      {/* ── TRAINING SECTIONS ── */}
      {data.trainings.map((training, ti) => (
        <div key={ti} style={{ background: '#111', border: '1px solid #333', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
          {/* header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
            background: `${training.color}18`,
            borderBottom: `2px solid ${training.color}`,
          }}>
            <MI name="fitness_center" style={{ fontSize: 22, color: training.color }} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#888' }}>{training.label}</div>
              {readOnly
                ? <div style={{ fontSize: 14, fontWeight: 900, color: training.color }}>{training.name}</div>
                : <input className="field-input" style={{ fontSize: 14, fontWeight: 900, color: training.color, width: 280 }} value={training.name}
                    onChange={e => { const ts = [...data.trainings]; ts[ti] = { ...training, name: e.target.value }; setData({ trainings: ts }) }} />
              }
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 8.5, color: '#888', letterSpacing: 1, fontWeight: 700 }}>REGISTRO DO ALUNO ▶</span>
            {!readOnly && (
              <button
                onClick={() => deleteTraining(ti)}
                title="Remover treino"
                style={{ background: 'transparent', border: '1px solid #555', color: '#888', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <MI name="delete" style={{ fontSize: 13, color: '#e05a5a' }} /> REMOVER TREINO
              </button>
            )}
          </div>

          {/* exercise table */}
          <div className="ws-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 560 }}>
              <thead>
                <tr>
                  {['#', 'EXERCÍCIO', 'SÉRIES', 'REPS', 'CADÊNCIA', 'DESCANSO', 'RIR', 'CARGA (KG)', 'REPS REAIS', 'ESFORÇO (0-10)', 'EXECUÇÃO / FOCO'].map((h, hi) => (
                    <th key={hi} className={hi === 0 ? 'ws-sticky-num' : hi === 1 ? 'ws-sticky-name' : ''} style={{ ...thStyle, textAlign: hi <= 1 || hi === 10 ? 'left' : 'center', borderLeft: hi === 7 ? `2px solid ${gold}` : undefined, background: hi >= 7 && hi <= 9 ? '#1a1209' : '#252525' }}>
                      {h}
                    </th>
                  ))}
                  {!readOnly && <th style={{ ...thStyle, width: 28 }} />}
                </tr>
              </thead>
              <tbody>
                {training.exercises.map((ex, ei) => {
                  const rec = getExRec(ex.id)
                  const rowBg = ei % 2 === 0 ? '#111' : '#131313'
                  return (
                    <tr key={ex.id} style={{ background: ei % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td className="ws-sticky-num-row" style={{ ...cell, color: gold, fontWeight: 700, textAlign: 'center', width: 22, background: rowBg }}>{ei + 1}</td>
                      <td className="ws-sticky-name-row" style={{ ...cell, minWidth: 140, background: rowBg }}>
                        <FI value={ex.name} onChange={v => { const ts = [...data.trainings]; ts[ti].exercises[ei] = { ...ex, name: v }; setData({ trainings: ts }) }} readOnly={readOnly} placeholder="Exercício" />
                      </td>
                      {(['series', 'reps', 'cadence', 'rest', 'rir'] as const).map(f => (
                        <td key={f} style={{ ...cell, textAlign: 'center' }}>
                          <FI value={(ex as unknown as Record<string, string>)[f]} onChange={v => { const ts = [...data.trainings]; (ts[ti].exercises[ei] as unknown as Record<string, string>)[f] = v; setData({ trainings: ts }) }} readOnly={readOnly} />
                        </td>
                      ))}
                      <td style={{ ...cell, borderLeft: `2px solid ${gold}`, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                        <RI value={rec.weight} onChange={v => setExRec(ex.id, 'weight', v)} />
                      </td>
                      <td style={{ ...cell, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                        <RI value={rec.realReps} onChange={v => setExRec(ex.id, 'realReps', v)} />
                      </td>
                      <td style={{ ...cell, background: 'rgba(201,160,80,0.04)', textAlign: 'center' }}>
                        <RI value={rec.effort} onChange={v => setExRec(ex.id, 'effort', v)} />
                      </td>
                      <td style={{ ...cell, textAlign: 'left', color: '#888', fontSize: 9 }}>
                        <FI value={ex.focus} onChange={v => { const ts = [...data.trainings]; ts[ti].exercises[ei] = { ...ex, focus: v }; setData({ trainings: ts }) }} readOnly={readOnly} placeholder="Foco" />
                      </td>
                      {!readOnly && (
                        <td style={{ ...cell, textAlign: 'center', width: 28 }}>
                          <button
                            onClick={() => deleteExercise(ti, ei)}
                            title="Remover linha"
                            style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 2, lineHeight: 1, fontSize: 14 }}
                          >
                            <MI name="remove_circle_outline" style={{ fontSize: 15, color: '#e05a5a' }} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* add row button */}
          {!readOnly && (
            <div style={{ padding: '6px 12px', borderTop: '1px solid #1e1e1e' }}>
              <button
                onClick={() => addExercise(ti)}
                style={{ background: 'transparent', border: `1px dashed ${training.color}`, color: training.color, borderRadius: 4, padding: '4px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MI name="add" style={{ fontSize: 14, color: training.color }} /> ADICIONAR EXERCÍCIO
              </button>
            </div>
          )}
        </div>
      ))}

      {/* add training button */}
      {!readOnly && (
        <button
          onClick={addTraining}
          style={{ width: '100%', marginBottom: 12, background: 'transparent', border: `2px dashed ${gold}`, color: gold, borderRadius: 6, padding: '10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: 1 }}
        >
          <MI name="add_circle_outline" style={{ fontSize: 18, color: gold }} /> ADICIONAR TREINO
        </button>
      )}

      {/* ── BOTTOM 4-COL ── */}
      <div className="ws-grid-4">
        {/* Progressão */}
        <Card icon="trending_up" title="PROGRESSÃO">
          {data.progression.map((item, i) => (
            <BulletRow key={i}>
              <FI value={item} onChange={v => { const p = [...data.progression]; p[i] = v; setData({ progression: p }) }} readOnly={readOnly} placeholder="Regra" />
            </BulletRow>
          ))}
        </Card>

        {/* Cardio */}
        <Card icon="favorite" title="CARDIO">
          {([
            { label: 'Frequência:', key: 'frequency' },
            { label: 'Duração:', key: 'duration' },
            { label: 'Intensidade:', key: 'intensity' },
            { label: 'Modalidade:', key: 'modality' },
          ] as const).map(({ label, key }) => (
            <FieldRow key={key} label={label}>
              <FI value={data.cardio[key]} onChange={v => setData({ cardio: { ...data.cardio, [key]: v } })} readOnly={readOnly} />
            </FieldRow>
          ))}
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #1e1e1e' }}>
            <FI value={data.cardio.note} onChange={v => setData({ cardio: { ...data.cardio, note: v } })} readOnly={readOnly} placeholder="Nota" style={{ fontSize: 9, color: '#888' }} />
          </div>
        </Card>

        {/* Aquecimento */}
        <Card icon="local_fire_department" title="AQUECIMENTO">
          {data.warmup.map((item, i) => (
            <BulletRow key={i}>
              <FI value={item} onChange={v => { const w = [...data.warmup]; w[i] = v; setData({ warmup: w }) }} readOnly={readOnly} placeholder="Passo" />
            </BulletRow>
          ))}
        </Card>

        {/* Instruções Extras */}
        <Card icon="star" title="INSTRUÇÕES EXTRAS">
          {data.extraInstructions.map((item, i) => (
            <BulletRow key={i}>
              <FI value={item} onChange={v => { const ins = [...data.extraInstructions]; ins[i] = v; setData({ extraInstructions: ins }) }} readOnly={readOnly} placeholder="Instrução" />
            </BulletRow>
          ))}
        </Card>
      </div>

      {/* ── WEEKLY LOG ── */}
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ background: gold, color: '#000', fontWeight: 900, fontSize: 10, letterSpacing: 1, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <NumBadge n="8" /> REGISTRO SEMANAL
        </div>
        <div className="ws-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 560 }}>
            <thead>
              <tr>
                {['SEMANA', 'PESO (KG)', 'MEDIDAS (CM)', 'FOTOS', 'PERCEPÇÃO (0-10)', 'ENERGIA (0-10)', 'SONO (0-10)', 'OBSERVAÇÕES'].map((h, i) => (
                  <th key={i} style={{ ...thStyle }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['week1', 'week2', 'week3', 'week4'].map((wk, i) => {
                const wdata = getWeek(wk)
                return (
                  <tr key={wk}>
                    <td style={{ ...cell, color: gold, fontWeight: 700, background: '#1c1c1c', paddingLeft: 10 }}>
                      Semana {i + 1}
                    </td>
                    {(['weight', 'measurements', 'photos', 'perception', 'energy', 'sleep', 'notes'] as const).map(f => (
                      <td key={f} style={{ ...cell, textAlign: 'center' }}>
                        <RI value={(wdata as unknown as Record<string, string>)[f]} onChange={v => setWeek(wk, f, v)} placeholder="—" />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADJUSTMENTS ── */}
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ background: gold, color: '#000', fontWeight: 900, fontSize: 10, letterSpacing: 1, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <NumBadge n="9" /> AJUSTES E ACOMPANHAMENTO
        </div>
        <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { label: 'Revisão:', key: 'review' },
            { label: 'Ajustes:', key: 'adjustments' },
            { label: 'Feedback:', key: 'feedback' },
            { label: 'Próxima avaliação:', key: 'nextEvaluation' },
          ] as const).map(({ label, key }) => (
            <FieldRow key={key} label={label}>
              <FI value={data.adjustments[key]} onChange={v => setData({ adjustments: { ...data.adjustments, [key]: v } })} readOnly={readOnly} />
            </FieldRow>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, color: '#888' }}>
          <><MI name="phone" style={{ color: gold, fontSize: 13 }} /><FI value={data.footer.phone} onChange={v => setData({ footer: { ...data.footer, phone: v } })} readOnly={readOnly} style={{ width: 120, borderBottomColor: '#333' }} /></>
          <><MI name="photo_camera" style={{ color: gold, fontSize: 13 }} /><FI value={data.footer.instagram} onChange={v => setData({ footer: { ...data.footer, instagram: v } })} readOnly={readOnly} style={{ width: 130, borderBottomColor: '#333' }} /></>
          <><MI name="email" style={{ color: gold, fontSize: 13 }} /><FI value={data.footer.email} onChange={v => setData({ footer: { ...data.footer, email: v } })} readOnly={readOnly} style={{ width: 180, borderBottomColor: '#333' }} /></>
        </div>
        <div style={{ color: gold, fontWeight: 900, fontSize: 11, letterSpacing: 2 }}>
          DISCIPLINA <span style={{ color: '#888' }}>•</span> FOCO <span style={{ color: '#888' }}>•</span> CONSTÂNCIA <span style={{ color: '#888' }}>•</span> RESULTADOS
        </div>
      </div>
    </div>
  )
}

// ── helper sub-components ──────────────────────────────────────────────────
function Card({ num, icon, title, children }: { num?: string; icon?: string; title: string; children: React.ReactNode }) {
  const gold = '#c9a050'
  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ background: gold, color: '#000', fontWeight: 900, fontSize: 10, letterSpacing: 1, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {num && <NumBadge n={num} />}
        {icon && <span className="material-icons-outlined" style={{ fontSize: 15 }}>{icon}</span>}
        {title}
      </div>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  )
}

function NumBadge({ n }: { n: string }) {
  return (
    <span style={{ background: '#000', color: '#c9a050', width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
      {n}
    </span>
  )
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid #1e1e1e', padding: '4px 0', gap: 6 }}>
      <span style={{ color: '#c9a050', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 9.5, minWidth: 100 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function BulletRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid #1e1e1e', padding: '3px 0', gap: 6, fontSize: 10 }}>
      <span style={{ color: '#c9a050', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>✓</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
