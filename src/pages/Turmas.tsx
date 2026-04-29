import { useNavigate } from 'react-router-dom'
import { useSchoolData, type Turma, type Aluno, type Nota } from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { useState } from 'react'



function TurmaRow({
  turma,
  alunos,
  notas,
}: {
  turma: Turma
  alunos: Aluno[]
  notas: Nota[]
}) {
  const navigate = useNavigate()
  const alunosTurma = alunos.filter((a) => a.turma_id === turma.id)
  const alunosComNota = new Set(
    notas
      .filter((n) => alunosTurma.some((a) => a.id === n.aluno_id))
      .map((n) => n.aluno_id)
  ).size
  const progress = alunosTurma.length
    ? Math.round((alunosComNota / alunosTurma.length) * 100)
    : 0
  const pendencias = Math.max(alunosTurma.length - alunosComNota, 0)

  return (
    <div
      onClick={() => navigate(`/turmas/${turma.id}`)}
      className="grid cursor-pointer gap-3 px-6 py-4 hover:bg-gray-50 transition-colors md:grid-cols-[1fr_auto_auto] md:items-center"
    >
      <div>
        <p className="font-semibold text-gray-900">{turma.nome}</p>
        <p className="text-sm text-gray-400">
          Ano {turma.ano} · {alunosTurma.length} alunos
        </p>
      </div>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          progress < 80 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}
      >
        {pendencias} pendências
      </span>
      <div className="min-w-[8rem]">
        <div className="h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-[#185FA5] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{progress}%</p>
      </div>
    </div>
  )
}

export default function Turmas() {
  const { data, isLoading, error } = useSchoolData()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const turmas = data?.turmas ?? []
  const alunos = data?.alunos ?? []
  const notas = data?.notas ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Gestão de turmas</h2>
        <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Cadastrar turma
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {turmas.length === 0 ? (
          <EmptyState text="Nenhuma turma cadastrada." />
        ) : (
          turmas.map((turma) => (
            <TurmaRow key={turma.id} turma={turma} alunos={alunos} notas={notas} />
          ))
        )}
      </div>
    </div>
  )
}