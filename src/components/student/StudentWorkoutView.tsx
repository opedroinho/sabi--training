'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutTemplate } from '@/components/workout/WorkoutTemplate'
import { TemplateData, StudentRecordData } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/LogoutButton'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [acceptingUpdate, setAcceptingUpdate] = useState(false)

  const hasPendingUpdate = assignment.pending_version !== null

  const handleRecordChange = useCallback((r: StudentRecordData) => {
    setRecord(r)
    setSaved(false)
  }, [])

  async function saveRecord() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('student_records').upsert({
      assignment_id: assignment.id,
      student_id: (await supabase.auth.getUser()).data.user!.id,
      data: record,
    })
    setSaving(false)
    setSaved(true)
  }

  // Auto-save every 30s if there are unsaved changes
  useEffect(() => {
    if (saved) return
    const timer = setTimeout(saveRecord, 30_000)
    return () => clearTimeout(timer)
  }, [record, saved])

  async function acceptUpdate() {
    setAcceptingUpdate(true)
    const supabase = createClient()
    await supabase
      .from('assignments')
      .update({ current_version: assignment.pending_version, pending_version: null })
      .eq('id', assignment.id)
    setAcceptingUpdate(false)
    router.refresh()
  }

  async function dismissUpdate() {
    const supabase = createClient()
    await supabase
      .from('assignments')
      .update({ pending_version: null })
      .eq('id', assignment.id)
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Top bar */}
      <div id="save-bar" style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#111', borderBottom: '2px solid #c9a050',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#c9a050', border: '2px solid #c9a050', padding: '2px 8px', borderRadius: 4, letterSpacing: -1 }}>WS</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a050' }}>{template.name}</div>
          <div style={{ fontSize: 10, color: '#666' }}>Olá, {studentName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && <span style={{ fontSize: 10, color: '#4dc87a' }}>✓ Salvo</span>}
          <button
            onClick={saveRecord}
            disabled={saving}
            style={{
              background: '#c9a050', color: '#000', border: 'none',
              padding: '6px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              letterSpacing: 0.5,
            }}
          >
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              background: 'transparent', border: '1px solid #444', color: '#888',
              padding: '6px 10px', borderRadius: 4, fontSize: 11,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 13 }}>print</span>
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Pending update banner */}
      {hasPendingUpdate && (
        <div style={{
          background: 'rgba(201,160,80,0.12)', borderBottom: '1px solid #c9a050',
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span className="material-icons-outlined" style={{ color: '#c9a050', fontSize: 18 }}>notification_important</span>
          <span style={{ fontSize: 12, color: '#e0bc74', flex: 1 }}>
            <strong>Wilson enviou uma atualização</strong> para o seu treino (v{assignment.pending_version}).
            Aceitar vai substituir o treino atual pelo novo.
          </span>
          <button
            onClick={acceptUpdate}
            disabled={acceptingUpdate}
            style={{
              background: '#c9a050', color: '#000', border: 'none',
              padding: '6px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700,
              cursor: acceptingUpdate ? 'not-allowed' : 'pointer',
            }}
          >
            {acceptingUpdate ? 'ACEITANDO...' : 'ACEITAR'}
          </button>
          <button
            onClick={dismissUpdate}
            style={{
              background: 'transparent', color: '#888', border: '1px solid #444',
              padding: '6px 14px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
            }}
          >
            IGNORAR
          </button>
        </div>
      )}

      {/* Workout */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 18 }}>
        <WorkoutTemplate
          data={template.data}
          record={record}
          readOnly={true}
          onRecordChange={handleRecordChange}
        />
      </div>
    </div>
  )
}
