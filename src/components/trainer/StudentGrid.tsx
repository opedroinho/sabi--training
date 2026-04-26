'use client'

import Link from 'next/link'
import { useState } from 'react'

const gold = '#c9a050'

interface Student {
  id: string
  name: string
  status: string | null
}

interface Props {
  students: Student[]
  activeTraining: Record<string, string>
}

function StudentCard({ student, training }: { student: Student; training?: string }) {
  const [hovered, setHovered] = useState(false)
  const isActive = student.status !== 'inactive'

  return (
    <Link
      key={student.id}
      href={`/trainer/student/${student.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          background: '#111',
          border: `1px solid ${hovered ? gold : isActive ? '#2a2a2a' : '#1e1e1e'}`,
          borderRadius: 10, padding: '16px 18px', cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          opacity: isActive ? 1 : 0.6,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* status + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: isActive ? '#4dc87a' : '#555',
            boxShadow: isActive ? '0 0 6px #4dc87a88' : 'none',
          }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8e8', flex: 1 }}>
            {student.name}
          </span>
          {!isActive && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#555', background: '#1a1a1a', padding: '2px 6px', borderRadius: 3 }}>
              INATIVO
            </span>
          )}
        </div>

        {/* active training */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-icons-outlined" style={{ fontSize: 13, color: training ? gold : '#333' }}>
            fitness_center
          </span>
          <span style={{ fontSize: 11, color: training ? '#c8c8c8' : '#444' }}>
            {training ?? 'Sem treino ativo'}
          </span>
        </div>

        {/* arrow */}
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <span className="material-icons-outlined" style={{ fontSize: 16, color: '#333' }}>arrow_forward</span>
        </div>
      </div>
    </Link>
  )
}

export function StudentGrid({ students, activeTraining }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : students

  return (
    <div>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span
          className="material-icons-outlined"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#555', pointerEvents: 'none' }}
        >
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar aluno..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '9px 12px 9px 34px',
            color: '#e8e8e8', fontSize: 13, outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = gold)}
          onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#555', display: 'flex', alignItems: 'center',
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Empty states */}
      {students.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12 }}>
          Nenhum aluno cadastrado ainda.
        </div>
      )}

      {students.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 12 }}>
          Nenhum aluno encontrado para <span style={{ color: '#666' }}>"{query}"</span>.
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            training={activeTraining[student.id]}
          />
        ))}
      </div>
    </div>
  )
}
