import { supabase } from './supabase'
import type { NotaImportada }  from './parsers/parseBoletim'
import { getArea } from './mapeamentoDisciplinas'

async function upsertTurma(nome: string, ano: number): Promise<string> {
  const { data, error } = await supabase
    .from('turmas')
    .upsert({ nome, ano }, { onConflict: 'nome,ano' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function upsertAluno(nome: string, turmaId: string): Promise<string> {
  const { data, error } = await supabase
    .from('alunos')
    .upsert({ nome, turma_id: turmaId }, { onConflict: 'nome,turma_id' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function upsertDisciplina(nome: string, areaNome: string): Promise<string> {
  // Upsert área
  const { data: area, error: areaError } = await supabase
    .from('areas')
    .upsert({ nome: areaNome }, { onConflict: 'nome' })
    .select('id')
    .single()
  if (areaError) throw areaError

  const { data, error } = await supabase
    .from('disciplinas')
    .upsert({ nome, area_id: area.id }, { onConflict: 'nome' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function importarNotas(
  notas: NotaImportada[],
  onProgress?: (atual: number, total: number) => void
) {
  const cache = {
    turmas: new Map<string, string>(),
    alunos: new Map<string, string>(),
    disciplinas: new Map<string, string>(),
  }

  const erros: string[] = []

  for (let i = 0; i < notas.length; i++) {
    const n = notas[i]
    onProgress?.(i + 1, notas.length)

    try {
      // Turma
      const turmaKey = `${n.turma}`
      if (!cache.turmas.has(turmaKey)) {
        cache.turmas.set(turmaKey, await upsertTurma(n.turma, new Date().getFullYear()))
      }
      const turmaId = cache.turmas.get(turmaKey)!

      // Aluno
      const alunoKey = `${n.nomeAluno}-${turmaId}`
      if (!cache.alunos.has(alunoKey)) {
        cache.alunos.set(alunoKey, await upsertAluno(n.nomeAluno, turmaId))
      }
      const alunoId = cache.alunos.get(alunoKey)!

      // Disciplina
      if (!cache.disciplinas.has(n.disciplina)) {
        const area = getArea(n.disciplina)
        cache.disciplinas.set(n.disciplina, await upsertDisciplina(n.disciplina, area))
      }
      const disciplinaId = cache.disciplinas.get(n.disciplina)!

      // Nota
      await supabase.from('notas').upsert(
        {
          aluno_id: alunoId,
          disciplina_id: disciplinaId,
          etapa: n.etapa,
          nota: n.nota,
          frequencia: n.frequencia,
        },
        { onConflict: 'aluno_id,disciplina_id,etapa' }
      )
    } catch (e) {
      erros.push(`Erro em ${n.nomeAluno} - ${n.disciplina} etapa ${n.etapa}`)
    }
  }

  return erros
}