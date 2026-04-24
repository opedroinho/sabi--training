import Link from 'next/link'

interface Props {
  templates: { id: string; name: string; version: number; updated_at: string }[]
  assignments: { template_id: string }[]
}

export function TemplateList({ templates, assignments }: Props) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ background: '#111', border: '1px solid #333' }}>
        <p className="text-sm" style={{ color: '#666' }}>Nenhum treino criado ainda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {templates.map(t => {
        const studentCount = assignments.filter(a => a.template_id === t.id).length
        return (
          <Link
            key={t.id}
            href={`/trainer/template/${t.id}`}
            className="block rounded-lg p-4 transition-colors hover:border-yellow-600"
            style={{ background: '#111', border: '1px solid #333' }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-bold text-sm" style={{ color: '#e8e8e8' }}>{t.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded font-bold ml-2 shrink-0"
                style={{ background: 'rgba(201,160,80,0.15)', color: '#c9a050' }}
              >
                v{t.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#666' }}>
                {studentCount} {studentCount === 1 ? 'aluno' : 'alunos'}
              </span>
              <span className="text-xs" style={{ color: '#c9a050' }}>
                Editar →
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
