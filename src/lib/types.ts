export type Role = 'trainer' | 'student'

export interface Profile {
  id: string
  name: string
  role: Role
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  series: string
  reps: string
  cadence: string
  rest: string
  rir: string
  focus: string
}

export interface TrainingSection {
  label: string       // e.g. "TREINO A"
  name: string        // e.g. "PEITO • OMBRO • TRÍCEPS"
  color: string       // tailwind text color class
  exercises: Exercise[]
}

export interface WeekPeriod {
  badge: string
  title: string
  desc: string
}

export interface TemplateData {
  studentInfo: {
    name: string; age: string; heightWeight: string; mainGoal: string
    level: string; trainingTime: string; injuries: string
    availableDays: string; sessionTime: string
  }
  trainingStructure: {
    division: string; weeklyFrequency: string; strategy: string
    method: string; restBetweenSeries: string; timeUnderTension: string
  }
  periodization: { weeks: WeekPeriod[]; note: string }
  trainings: TrainingSection[]
  progression: string[]
  cardio: { frequency: string; duration: string; intensity: string; modality: string; note: string }
  warmup: string[]
  extraInstructions: string[]
  adjustments: { review: string; adjustments: string; feedback: string; nextEvaluation: string }
  footer: { phone: string; instagram: string; email: string }
}

export interface ExerciseRecord {
  weight: string
  realReps: string
  effort: string
}

export interface WeekLog {
  weight: string; measurements: string; photos: string
  perception: string; energy: string; sleep: string; notes: string
}

export interface StudentRecordData {
  exercises: Record<string, ExerciseRecord>   // keyed by exercise id
  weeklyLog: Record<string, WeekLog>           // keyed by "week1"..."week4"
}

export interface Template {
  id: string
  trainer_id: string
  name: string
  version: number
  data: TemplateData
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  template_id: string
  student_id: string
  trainer_id: string
  current_version: number
  pending_version: number | null
  created_at: string
}

export interface StudentRecord {
  id: string
  assignment_id: string
  student_id: string
  data: StudentRecordData
  updated_at: string
}

// Default blank template Wilson starts from
export const DEFAULT_TEMPLATE: TemplateData = {
  studentInfo: {
    name: '', age: '', heightWeight: '', mainGoal: '',
    level: '', trainingTime: '', injuries: '', availableDays: '', sessionTime: '',
  },
  trainingStructure: {
    division: '', weeklyFrequency: '', strategy: '',
    method: '', restBetweenSeries: '', timeUnderTension: '',
  },
  periodization: {
    weeks: [
      { badge: 'SEMANA 1', title: '', desc: '' },
      { badge: 'SEMANA 2', title: '', desc: '' },
      { badge: 'SEMANA 3', title: '', desc: '' },
      { badge: 'SEMANA 4', title: '', desc: '' },
    ],
    note: '',
  },
  trainings: [
    {
      label: 'TREINO A', name: 'PEITO • OMBRO • TRÍCEPS', color: '#c9a050',
      exercises: Array.from({ length: 6 }, (_, i) => ({
        id: `a${i + 1}`, name: '', series: '', reps: '', cadence: '', rest: '', rir: '', focus: '',
      })),
    },
    {
      label: 'TREINO B', name: 'COSTAS • BÍCEPS', color: '#4da6c8',
      exercises: Array.from({ length: 6 }, (_, i) => ({
        id: `b${i + 1}`, name: '', series: '', reps: '', cadence: '', rest: '', rir: '', focus: '',
      })),
    },
    {
      label: 'TREINO C', name: 'PERNA COMPLETA', color: '#4dc87a',
      exercises: Array.from({ length: 6 }, (_, i) => ({
        id: `c${i + 1}`, name: '', series: '', reps: '', cadence: '', rest: '', rir: '', focus: '',
      })),
    },
  ],
  progression: ['', '', '', '', ''],
  cardio: { frequency: '', duration: '', intensity: '', modality: '', note: '' },
  warmup: ['', '', ''],
  extraInstructions: ['', '', '', '', '', ''],
  adjustments: { review: '', adjustments: '', feedback: '', nextEvaluation: '' },
  footer: { phone: '', instagram: '', email: '' },
}
