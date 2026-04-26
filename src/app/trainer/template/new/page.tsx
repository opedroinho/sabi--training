import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_TEMPLATE } from '@/lib/types'

interface Props { searchParams: Promise<{ student?: string }> }

export default async function NewTemplatePage({ searchParams }: Props) {
  const { student: studentId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      trainer_id: user!.id,
      student_id: studentId ?? null,
      name: 'Novo Treino',
      version: 1,
      data: DEFAULT_TEMPLATE,
    })
    .select()
    .single()

  if (error || !template) redirect(studentId ? `/trainer/student/${studentId}` : '/trainer')

  redirect(`/trainer/template/${template.id}${studentId ? `?student=${studentId}` : ''}`)
}
