import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Turma = { id: string; nome: string; ano: number }
export type Aluno = { id: string; nome: string; turma_id: string | null }
export type Nota = {
  id: string
  aluno_id: string | null
  disciplina_id: string | null
  etapa: number | null
  nota: number | null
  frequencia: number | null
}
export type Disciplina = { id: string; nome: string; area_id: string | null }

export type SchoolData = {
  turmas: Turma[]
  alunos: Aluno[]
  notas: Nota[]
  disciplinas: Disciplina[]
}

export function useSchoolData() {
  const [data, setData] = useState<SchoolData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const [turmasRes, alunosRes, notasRes, disciplinasRes] = await Promise.all([
          supabase
            .from('turmas')
            .select('id,nome,ano')
            .order('ano', { ascending: false })
            .order('nome'),
          supabase.from('alunos').select('id,nome,turma_id').order('nome'),
          supabase.from('notas').select('id,aluno_id,disciplina_id,etapa,nota,frequencia'),
          supabase.from('disciplinas').select('id,nome,area_id').order('nome'),
        ])

        const err =
          turmasRes.error || alunosRes.error || notasRes.error || disciplinasRes.error
        if (err) throw err

        setData({
          turmas: (turmasRes.data ?? []) as Turma[],
          alunos: (alunosRes.data ?? []) as Aluno[],
          notas: (notasRes.data ?? []) as Nota[],
          disciplinas: (disciplinasRes.data ?? []) as Disciplina[],
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { data, isLoading, error }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}