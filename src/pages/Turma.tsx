import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import HeaderComVoltar from '../components/HeaderComVoltar'

interface Aluno {
  id: string
  nome: string
  frequencia: number
  nota: number
}

type OrderBy = 'nome' | 'nota' | 'frequencia'
type OrderDir = 'asc' | 'desc'

export default function Turma() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [nomeTurma, setNomeTurma] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('nome')
  const [orderDir, setOrderDir] = useState<OrderDir>('asc')

  useEffect(() => {
    if (id) carregarDados()
  }, [id])

  async function carregarDados() {
    try {
      setLoading(true)
      setError('')

      // Buscar nome da turma
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('nome')
        .eq('id', id)
        .single()

      if (turmaError) throw turmaError
      setNomeTurma(turmaData?.nome || '')

      // Buscar alunos da turma com suas notas na etapa atual
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          notas (nota, frequencia, etapa)
        `)
        .eq('turma_id', id)

      if (alunosError) throw alunosError

      // Processar dados dos alunos
      const alunosProcessados: Aluno[] = (alunosData || []).map(aluno => {
        // Calcular média das 3 etapas
        const notas = aluno.notas as any[] || []
        const mediaFreq = notas.length > 0 
          ? notas.reduce((acc, n) => acc + (n.frequencia || 0), 0) / notas.length
          : 0
        const mediaNota = notas.length > 0
          ? notas.reduce((acc, n) => acc + (n.nota || 0), 0) / notas.length
          : 0

        return {
          id: aluno.id,
          nome: aluno.nome,
          frequencia: Math.round(mediaFreq),
          nota: parseFloat(mediaNota.toFixed(1))
        }
      })

      setAlunos(alunosProcessados)
    } catch (err) {
      console.error('Erro ao carregar turma:', err)
      setError('Erro ao carregar dados da turma')
    } finally {
      setLoading(false)
    }
  }

  // Calcular métricas
  const mediaNota = alunos.length > 0 
    ? (alunos.reduce((acc, a) => acc + a.nota, 0) / alunos.length).toFixed(1)
    : '0'
  
  const mediaFrequencia = alunos.length > 0
    ? Math.round(alunos.reduce((acc, a) => acc + a.frequencia, 0) / alunos.length)
    : 0

  // Ordenação
  const alunosOrdenados = [...alunos].sort((a, b) => {
    let aVal, bVal
    
    if (orderBy === 'nome') {
      aVal = a.nome.toLowerCase()
      bVal = b.nome.toLowerCase()
    } else if (orderBy === 'nota') {
      aVal = a.nota
      bVal = b.nota
    } else {
      aVal = a.frequencia
      bVal = b.frequencia
    }

    if (aVal < bVal) return orderDir === 'asc' ? -1 : 1
    if (aVal > bVal) return orderDir === 'asc' ? 1 : -1
    return 0
  })

  // Verificar se todos têm notas
  const todosComNotas = alunos.every(a => a.nota > 0)

  const handleSort = (campo: OrderBy) => {
    if (orderBy === campo) {
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(campo)
      setOrderDir('asc')
    }
  }

  const renderSortIcon = (campo: OrderBy) => {
    if (orderBy !== campo) return ' ↕'
    return orderDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="flex flex-col gap-6">
      <HeaderComVoltar 
        titulo={nomeTurma || 'Carregando...'}
        onVoltar={() => navigate('/Dashboard')}
      />

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-4 py-6 text-center text-gray-500">
          Carregando dados da turma...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl px-4 py-6 text-center text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { label: 'Média de nota', value: mediaNota, sub: 'da turma' },
              { label: 'Média de presença', value: `${mediaFrequencia}%`, sub: 'da turma' },
              { label: 'Quantidade de alunos', value: String(alunos.length), sub: 'matriculados' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4">
                <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabela de Alunos */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Alunos</h2>
              {todosComNotas && (
                <button
                  className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => {
                    // TODO: Implementar envio de boletins
                    alert('Enviar boletins - função a implementar')
                  }}
                >
                  Enviar boletins
                </button>
              )}
            </div>

            {alunos.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-4 py-6 text-center text-gray-500">
                Nenhum aluno encontrado nesta turma
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 md:px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                        <button
                          onClick={() => handleSort('nome')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Nome
                          <span className="text-xs">{renderSortIcon('nome')}</span>
                        </button>
                      </th>
                      <th className="text-center px-3 md:px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                        <button
                          onClick={() => handleSort('frequencia')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                        >
                          Frequência
                          <span className="text-xs">{renderSortIcon('frequencia')}</span>
                        </button>
                      </th>
                      <th className="text-center px-3 md:px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                        <button
                          onClick={() => handleSort('nota')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                        >
                          Média
                          <span className="text-xs">{renderSortIcon('nota')}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosOrdenados.map((aluno, idx) => (
                      <tr
                        key={aluno.id}
                        className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 md:px-4 py-3 text-gray-900 font-medium truncate">
                          <button
                            onClick={() => navigate(`/aluno/${aluno.id}`)}
                            className="text-left hover:text-blue-600 transition-colors w-full"
                          >
                            {aluno.nome}
                          </button>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${
                            aluno.frequencia >= 75
                              ? 'text-green-600'
                              : aluno.frequencia >= 60
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}>
                            {aluno.frequencia}%
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${
                            aluno.nota >= 7
                              ? 'text-green-600'
                              : aluno.nota >= 5
                              ? 'text-amber-600'
                              : aluno.nota > 0
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}>
                            {aluno.nota > 0 ? aluno.nota.toFixed(1) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
  </div>
  )
}
