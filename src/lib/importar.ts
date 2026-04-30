import { supabase } from './supabase'
import type { NotaImportada } from './parsers/parseBoletim'

export async function importarNotas(
  notas: NotaImportada[],
  onProgress?: (atual: number, total: number) => void
): Promise<string[]> {
  const erros: string[] = []

  let atual = 0
  const total = notas.length

  // caches pra evitar bater no banco toda hora
  const cacheTurmas = new Map<string, string>()
  const cacheAlunos = new Map<string, string>()
  const cacheDisciplinas = new Map<string, string>()

  for (const n of notas) {
    try {
      // =========================
      // 🏫 TURMA
      // =========================
      let turmaId = cacheTurmas.get(n.turma)

      if (!turmaId) {
        const { data: turmaExistente } = await supabase
          .from('turmas')
          .select('id')
          .eq('nome', n.turma)
          .single()

        if (turmaExistente) {
          turmaId = turmaExistente.id
        } else {
          const { data: novaTurma, error } = await supabase
            .from('turmas')
            .insert({ nome: n.turma, ano: new Date().getFullYear() })
            .select()
            .single()

          if (error) throw error
          turmaId = novaTurma.id
        }

        cacheTurmas.set(n.turma, turmaId)
      }

      // =========================
      // 👤 ALUNO
      // =========================
      const alunoKey = `${n.nomeAluno}-${turmaId}`
      let alunoId = cacheAlunos.get(alunoKey)

      if (!alunoId) {
        const { data: alunoExistente } = await supabase
          .from('alunos')
          .select('id')
          .eq('nome', n.nomeAluno)
          .eq('turma_id', turmaId)
          .single()

        if (alunoExistente) {
          alunoId = alunoExistente.id
        } else {
          const { data: novoAluno, error } = await supabase
            .from('alunos')
            .insert({
              nome: n.nomeAluno,
              turma_id: turmaId,
            })
            .select()
            .single()

          if (error) throw error
          alunoId = novoAluno.id
        }

        cacheAlunos.set(alunoKey, alunoId)
      }

      // =========================
      // 📚 DISCIPLINA
      // =========================
      let disciplinaId = cacheDisciplinas.get(n.disciplina)

      if (!disciplinaId) {
        const { data: disciplinaExistente } = await supabase
          .from('disciplinas')
          .select('id')
          .eq('nome', n.disciplina)
          .single()

        if (disciplinaExistente) {
          disciplinaId = disciplinaExistente.id
        } else {
          const { data: novaDisciplina, error } = await supabase
            .from('disciplinas')
            .insert({
              nome: n.disciplina,
            })
            .select()
            .single()

          if (error) throw error
          disciplinaId = novaDisciplina.id
        }

        cacheDisciplinas.set(n.disciplina, disciplinaId)
      }

      // =========================
      // 📝 NOTA (UPSERT 🔥)
      // =========================
      const { error: erroNota } = await supabase
        .from('notas')
        .upsert(
          {
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            etapa: n.etapa,
            nota: n.nota,
            frequencia: n.frequencia,
          },
          {
            onConflict: 'aluno_id,disciplina_id,etapa',
          }
        )

      if (erroNota) throw erroNota

    } catch (err: any) {
      console.error(err)
      erros.push(`Erro com ${n.nomeAluno} (${n.disciplina})`)
    }

    atual++
    onProgress?.(atual, total)
  }

  return erros
}