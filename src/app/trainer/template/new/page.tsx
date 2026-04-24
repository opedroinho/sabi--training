import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '@/components/trainer/TemplateEditor'
import { DEFAULT_TEMPLATE } from '@/lib/types'

export default async function NewTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create a blank template row and redirect to its edit page
  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      trainer_id: user!.id,
      name: 'Novo Treino',
      version: 1,
      data: DEFAULT_TEMPLATE,
    })
    .select()
    .single()

  if (error || !template) redirect('/trainer')

  redirect(`/trainer/template/${template.id}`)
}
