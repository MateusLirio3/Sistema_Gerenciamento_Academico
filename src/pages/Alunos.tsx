import { useNavigate } from 'react-router-dom'
import {
  useSchoolData,
  formatNumber,
  type Aluno,
  type Turma,
  type Nota,
  type TurmaDisciplina,
} from '../hooks/useSchoolData'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

// Calcula o status de notas do aluno considerando as disciplinas da sua turma
function getStatusNotas(
  aluno: Aluno,
  notas: Nota[],
  turmaDisciplinas: TurmaDisciplina[]
): 'completo' | 'parcial' | 'pendente' {
  if (!aluno.turma_id) return 'pendente'

  // Disciplinas vinculadas à turma do aluno
  const disciplinasDaTurma = turmaDisciplinas
    .filter((td) => td.turma_id === aluno.turma_id)
    .map((td) => td.disciplina_id)

  if (disciplinasDaTurma.length === 0) return 'pendente'

  // Disciplinas que o aluno tem ao menos uma nota lançada
  const disciplinasComNota = new Set(
    notas
      .filter((n) => n.aluno_id === aluno.id && n.nota !== null)
      .map((n) => n.disciplina_id)
  )

  const totalDisciplinas = disciplinasDaTurma.length
  const totalComNota = disciplinasDaTurma.filter((id) => disciplinasComNota.has(id)).length

  if (totalComNota === 0) return 'pendente'
  if (totalComNota === totalDisciplinas) return 'completo'
  return 'parcial'
}

const STATUS_CONFIG = {
  completo: { label: 'Com notas', className: 'bg-green-50 text-green-700' },
  parcial:  { label: 'Incompleto', className: 'bg-amber-50 text-amber-700' },
  pendente: { label: 'Nota pendente', className: 'bg-red-50 text-red-600' },
}

function AlunoRow({
  aluno,
  turmas,
  notas,
  turmaDisciplinas,
}: {
  aluno: Aluno
  turmas: Turma[]
  notas: Nota[]
  turmaDisciplinas: TurmaDisciplina[]
}) {
  const navigate = useNavigate()
  const turma = turmas.find((t) => t.id === aluno.turma_id)

  const notasAluno = notas.filter((n) => n.aluno_id === aluno.id && n.nota !== null)
  const media = notasAluno.length
    ? notasAluno.reduce((sum, n) => sum + Number(n.nota), 0) / notasAluno.length
    : null

  const status = getStatusNotas(aluno, notas, turmaDisciplinas)
  const { label, className } = STATUS_CONFIG[status]

  return (
    <tr
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
              media >= 7 ? 'text-green-600' : media >= 5 ? 'text-amber-600' : 'text-red-600'
            }`}
          >
            {formatNumber(media)}
          </span>
        )}
      </td>
      <td className="px-6 py-3.5">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
          {label}
        </span>
      </td>
    </tr>
  )
}

export default function Alunos() {
  const { data, isLoading, error } = useSchoolData()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const alunos = data?.alunos ?? []
  const turmas = data?.turmas ?? []
  const notas = data?.notas ?? []
  const turmaDisciplinas = data?.turmaDisciplinas ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Cadastro e acompanhamento de alunos
        </h2>
        <p className="mt-0.5 text-sm text-gray-400">{alunos.length} alunos matriculados</p>
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
              {[...alunos]
                .sort((a, b) =>
                  a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' })
                )
                .map((aluno) => (
                  <AlunoRow
                    key={aluno.id}
                    aluno={aluno}
                    turmas={turmas}
                    notas={notas}
                    turmaDisciplinas={turmaDisciplinas}
                  />
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}