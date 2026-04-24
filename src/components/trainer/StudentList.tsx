'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  students: { id: string; name: string }[]
  templates: { id: string; name: string; version: number }[]
  assignments: { id: string; student_id: string; template_id: string; pending_version: number | null }[]
}

export function StudentList({ students, templates, assignments }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  function getAssignment(studentId: string) {
    return assignments.find(a => a.student_id === studentId)
  }

  async function assignTemplate(studentId: string, templateId: string) {
    setLoading(studentId)
    const supabase = createClient()
    const existing = getAssignment(studentId)

    if (existing) {
      await supabase
        .from('assignments')
        .update({ template_id: templateId, current_version: 1, pending_version: null })
        .eq('id', existing.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      // Find template version
      const tpl = templates.find(t => t.id === templateId)
      await supabase.from('assignments').insert({
        student_id: studentId,
        template_id: templateId,
        trainer_id: user!.id,
        current_version: tpl?.version ?? 1,
        pending_version: null,
      })
      // Create empty record
      const { data: assignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('student_id', studentId)
        .single()
      if (assignment) {
        await supabase.from('student_records').upsert({
          assignment_id: assignment.id,
          student_id: studentId,
          data: {},
        })
      }
    }
    setLoading(null)
    router.refresh()
  }

  if (students.length === 0) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ background: '#111', border: '1px solid #333' }}>
        <p className="text-sm" style={{ color: '#666' }}>Nenhum aluno cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#111', border: '1px solid #333' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: '#1c1c1c', borderBottom: '1px solid #333' }}>
            <th className="text-left px-4 py-3 font-bold tracking-wider" style={{ color: '#c9a050' }}>ALUNO</th>
            <th className="text-left px-4 py-3 font-bold tracking-wider" style={{ color: '#c9a050' }}>TREINO ATRIBUÍDO</th>
            <th className="px-4 py-3 font-bold tracking-wider" style={{ color: '#c9a050' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => {
            const assignment = getAssignment(student.id)
            const assignedTemplate = assignment
              ? templates.find(t => t.id === assignment.template_id)
              : null

            return (
              <tr
                key={student.id}
                style={{ borderBottom: i < students.length - 1 ? '1px solid #1e1e1e' : 'none' }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#e8e8e8' }}>
                  {student.name}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={assignment?.template_id ?? ''}
                    onChange={e => e.target.value && assignTemplate(student.id, e.target.value)}
                    disabled={loading === student.id || templates.length === 0}
                    style={{
                      background: '#1c1c1c',
                      border: '1px solid #333',
                      color: assignedTemplate ? '#e8e8e8' : '#666',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">— Selecionar treino —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {assignment?.pending_version ? (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: 'rgba(201,160,80,0.15)', color: '#c9a050', border: '1px solid #c9a050' }}
                    >
                      ATUALIZAÇÃO PENDENTE
                    </span>
                  ) : assignment ? (
                    <span className="text-xs" style={{ color: '#4dc87a' }}>● Ativo</span>
                  ) : (
                    <span className="text-xs" style={{ color: '#666' }}>Sem treino</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
