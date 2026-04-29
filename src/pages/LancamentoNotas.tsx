import { ClipboardList } from 'lucide-react'
import { useSchoolData, formatNumber } from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export default function LancamentoNotas() {
  const { data, isLoading, error } = useSchoolData()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const notas = data?.notas ?? []
  const alunos = data?.alunos ?? []
  const disciplinas = data?.disciplinas ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5 text-[#185FA5]" />
          Lançamento de notas
        </h2>
        <p className="mt-0.5 text-sm text-gray-400">{notas.length} notas registradas</p>
      </div>
      <div className="overflow-x-auto">
        {notas.length === 0 ? (
          <EmptyState text="Nenhuma nota lançada." />
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr>
                {['Aluno', 'Disciplina', 'Etapa', 'Nota', 'Frequência'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notas.map((nota) => {
                const nomeAluno =
                  alunos.find((a) => a.id === nota.aluno_id)?.nome ?? 'Aluno não encontrado'
                const nomeDisciplina =
                  disciplinas.find((d) => d.id === nota.disciplina_id)?.nome ?? 'Sem disciplina'
                const notaVal = nota.nota === null || nota.nota === undefined ? null : Number(nota.nota)

                return (
                  <tr key={nota.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{nomeAluno}</td>
                    <td className="px-6 py-3.5 text-gray-500">{nomeDisciplina}</td>
                    <td className="px-6 py-3.5 text-gray-500">{nota.etapa ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      {notaVal === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            notaVal >= 7
                              ? 'text-green-600'
                              : notaVal >= 5
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatNumber(notaVal)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {nota.frequencia === null || nota.frequencia === undefined
                        ? '—'
                        : `${formatNumber(Number(nota.frequencia))}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}