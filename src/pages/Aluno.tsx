import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import HeaderComVoltar from '../components/HeaderComVoltar'

interface Nota {
  disciplina: string
  etapa: number
  nota: number
  frequencia: number
}

export default function Aluno() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [nomeAluno, setNomeAluno] = useState('')
  const [nomeTurma, setNomeTurma] = useState('')
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) carregarDados()
  }, [id])

  async function carregarDados() {
    try {
      setLoading(true)
      setError('')

      // Buscar dados do aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          nome,
          turmas (nome)
        `)
        .eq('id', id)
        .single()

      if (alunoError) throw alunoError

      setNomeAluno(alunoData?.nome || '')
      setNomeTurma(alunoData?.turmas?.nome || '')

      // Buscar notas do aluno
      const { data: notasData, error: notasError } = await supabase
        .from('notas')
        .select(`
          nota,
          frequencia,
          etapa,
          disciplinas (nome)
        `)
        .eq('aluno_id', id)

      if (notasError) throw notasError

      // Processar notas
      const notasProcessadas: Nota[] = (notasData || []).map(nota => ({
        disciplina: (nota.disciplinas as any)?.nome || '',
        etapa: nota.etapa,
        nota: nota.nota,
        frequencia: nota.frequencia
      }))

      setNotas(notasProcessadas)
    } catch (err) {
      console.error('Erro ao carregar aluno:', err)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }

  // Calcular médias
  const mediaGeral = notas.length > 0
    ? (notas.reduce((acc, n) => acc + n.nota, 0) / notas.length).toFixed(1)
    : '0'

  const frequenciaGeral = notas.length > 0
    ? Math.round(notas.reduce((acc, n) => acc + n.frequencia, 0) / notas.length)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <HeaderComVoltar
        titulo={nomeAluno || 'Carregando...'}
        onVoltar={() => navigate(-1)}
      />

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-4 py-6 text-center text-gray-500">
          Carregando dados do aluno...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl px-4 py-6 text-center text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* Informações do Aluno */}
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium text-gray-900">{nomeAluno}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Turma</p>
                <p className="font-medium text-gray-900">{nomeTurma}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Média Geral</p>
                <p className={`font-bold text-lg ${
                  parseFloat(mediaGeral) >= 7
                    ? 'text-green-600'
                    : parseFloat(mediaGeral) >= 5
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {mediaGeral}
                </p>
              </div>
            </div>
          </div>

          {/* Notas por Disciplina */}
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl overflow-x-auto">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notas por Disciplina</h2>
              <p className="text-sm text-gray-500 mt-1">
                Frequência geral: <span className={`font-medium ${
                  frequenciaGeral >= 75
                    ? 'text-green-600'
                    : frequenciaGeral >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>{frequenciaGeral}%</span>
              </p>
            </div>

            {notas.length === 0 ? (
              <div className="px-4 md:px-6 py-8 text-center text-gray-500">
                Nenhuma nota encontrada
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 md:px-6 py-3 font-semibold text-gray-700">Disciplina</th>
                    <th className="text-center px-4 md:px-6 py-3 font-semibold text-gray-700">Etapa 1</th>
                    <th className="text-center px-4 md:px-6 py-3 font-semibold text-gray-700">Etapa 2</th>
                    <th className="text-center px-4 md:px-6 py-3 font-semibold text-gray-700">Etapa 3</th>
                    <th className="text-center px-4 md:px-6 py-3 font-semibold text-gray-700">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    notas.reduce((acc, nota) => {
                      if (!acc[nota.disciplina]) {
                        acc[nota.disciplina] = { 1: null, 2: null, 3: null }
                      }
                      acc[nota.disciplina][nota.etapa] = nota
                      return acc
                    }, {} as Record<string, Record<number, Nota | null>>)
                  ).map(([disciplina, etapas]) => {
                    const notasEtapas = [etapas[1], etapas[2], etapas[3]]
                    const media = notasEtapas.filter(n => n).length > 0
                      ? (notasEtapas.reduce((acc, n) => acc + (n?.nota || 0), 0) / notasEtapas.filter(n => n).length).toFixed(1)
                      : '-'

                    return (
                      <tr key={disciplina} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-3 font-medium text-gray-900">
                          {disciplina}
                        </td>
                        {[1, 2, 3].map(etapa => {
                          const nota = etapas[etapa]
                          return (
                            <td key={etapa} className="px-4 md:px-6 py-3 text-center">
                              {nota ? (
                                <div>
                                  <div className={`font-medium ${
                                    nota.nota >= 7
                                      ? 'text-green-600'
                                      : nota.nota >= 5
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                  }`}>
                                    {nota.nota.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {nota.frequencia}%
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 md:px-6 py-3 text-center">
                          <span className={`font-bold ${
                            parseFloat(media) >= 7
                              ? 'text-green-600'
                              : parseFloat(media) >= 5
                              ? 'text-amber-600'
                              : parseFloat(media) > 0
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}>
                            {media}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}