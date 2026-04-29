import { useNavigate } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import { useSchoolData, formatNumber } from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export default function Boletins() {
  const { data, isLoading, error } = useSchoolData()
  const navigate = useNavigate()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const alunos = data?.alunos ?? []
  const turmas = data?.turmas ?? []
  const notas = data?.notas ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileDown className="h-5 w-5 text-[#185FA5]" />
          Boletins por aluno
        </h2>
        <p className="mt-0.5 text-sm text-gray-400">
          Clique em um aluno para ver o boletim completo
        </p>
      </div>
      <div className="overflow-x-auto">
        {alunos.length === 0 ? (
          <EmptyState text="Nenhum aluno cadastrado." />
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-gray-100 text-left">
              <tr>
                {['Aluno', 'Turma', 'Média', 'Status'].map((h) => (
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
              {alunos.map((aluno) => {
                const turma = turmas.find((t) => t.id === aluno.turma_id)
                const notasAluno = notas.filter(
                  (n) => n.aluno_id === aluno.id && n.nota !== null
                )
                const media = notasAluno.length
                  ? notasAluno.reduce((sum, n) => sum + Number(n.nota), 0) / notasAluno.length
                  : null

                return (
                  <tr
                    key={aluno.id}
                    onClick={() => navigate(`/aluno/${aluno.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{aluno.nome}</td>
                    <td className="px-6 py-3.5 text-gray-500">{turma?.nome ?? 'Sem turma'}</td>
                    <td className="px-6 py-3.5">
                      {media === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            media >= 7
                              ? 'text-green-600'
                              : media >= 5
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatNumber(media)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          notasAluno.length
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {notasAluno.length ? 'Com notas' : 'Nota pendente'}
                      </span>
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