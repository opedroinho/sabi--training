'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WorkoutTemplate } from '@/components/workout/WorkoutTemplate'
import { TemplateData, StudentRecordData } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const EMPTY_RECORD: StudentRecordData = { exercises: {}, weeklyLog: {} }

interface Props {
  template: { id: string; name: string; version: number; data: TemplateData }
  hasAssignments: boolean
}

export function TemplateEditor({ template, hasAssignments }: Props) {
  const router = useRouter()
  const [name, setName] = useState(template.name)
  const [data, setData] = useState<TemplateData>(template.data)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleDataChange = useCallback((d: TemplateData) => setData(d), [])

  async function save(isUpdate: boolean) {
    setSaving(true)
    setMsg(null)

    if (isUpdate) {
      // Push update to all assigned students
      const res = await fetch('/api/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, data, name }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: 'err', text: json.error ?? 'Erro ao salvar.' })
      } else {
        setMsg({ type: 'ok', text: `Treino atualizado para v${json.version}! Alunos foram notificados.` })
        router.refresh()
      }
    } else {
      // First save — just update without bumping version
      const supabase = createClient()
      const { error } = await supabase
        .from('templates')
        .update({ data, name })
        .eq('id', template.id)
      if (error) {
        setMsg({ type: 'err', text: error.message })
      } else {
        setMsg({ type: 'ok', text: 'Treino salvo!' })
      }
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div id="toolbar" style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#000', borderBottom: '2px solid #c9a050',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Link
          href="/trainer"
          style={{ color: '#888', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
        >
          <span className="material-icons-outlined" style={{ fontSize: 14 }}>arrow_back</span>
          Dashboard
        </Link>
        <span style={{ color: '#444' }}>|</span>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            background: 'transparent', border: 'none', borderBottom: '1px dashed #555',
            color: '#e8e8e8', fontWeight: 700, fontSize: 13, outline: 'none', padding: '2px 4px', minWidth: 160,
          }}
          placeholder="Nome do treino"
        />

        <span style={{ color: '#666', fontSize: 10, marginLeft: 4 }}>
          v{template.version}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {msg && (
            <span style={{ fontSize: 11, color: msg.type === 'ok' ? '#4dc87a' : '#e05a5a' }}>
              {msg.text}
            </span>
          )}

          <button
            onClick={() => save(false)}
            disabled={saving}
            style={{
              background: 'transparent', border: '1px solid #c9a050', color: '#c9a050',
              padding: '6px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              letterSpacing: 0.5,
            }}
          >
            {saving ? 'SALVANDO...' : 'SALVAR RASCUNHO'}
          </button>

          {hasAssignments && (
            <button
              onClick={() => {
                if (confirm('Enviar atualização para todos os alunos atribuídos a este treino?')) {
                  save(true)
                }
              }}
              disabled={saving}
              style={{
                background: '#c9a050', color: '#000', border: 'none',
                padding: '6px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                letterSpacing: 0.5,
              }}
            >
              {saving ? 'ENVIANDO...' : '⬆ ENVIAR ATUALIZAÇÃO'}
            </button>
          )}

          <button
            onClick={() => window.print()}
            style={{
              background: 'transparent', border: '1px solid #444', color: '#888',
              padding: '6px 12px', borderRadius: 4, fontSize: 11,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 13 }}>print</span>
            PDF
          </button>
        </div>
      </div>

      {/* Template */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 18 }}>
        <WorkoutTemplate
          data={data}
          record={EMPTY_RECORD}
          readOnly={false}
          onDataChange={handleDataChange}
        />
      </div>
    </div>
  )
}
