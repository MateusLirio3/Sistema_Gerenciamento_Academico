import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Turma {
  id: string
  nome: string
  alunos: number
  status: 'completo' | 'pendente' | 'importar'
}

const statusConfig = {
  completo: { label: 'Notas completas', className: 'bg-green-50 text-green-700' },
  pendente: { label: '3 pendentes', className: 'bg-amber-50 text-amber-700' }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [totalAlunos, setTotalAlunos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      setError('')

      // Buscar turmas com contagem de alunos
      const { data: turmasData, error: turmasError } = await supabase
        .from('turmas')
        .select('id, nome')

      if (turmasError) throw turmasError
      if (!turmasData) return

      // Para cada turma, contar alunos e verificar status de notas
      const turmasComDados: Turma[] = []

      for (const turma of turmasData) {
        // Contar alunos na turma
        const { count: alunosCount } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('turma_id', turma.id)

        // Verificar notas faltantes (para determinar status)
        const { data: notasData } = await supabase
          .from('notas')
          .select('aluno_id')
          .eq('turma_id', turma.id)

        const notasFaltantes = (alunosCount || 0) * 3 - (notasData?.length || 0)
        let status: 'completo' | 'pendente'

        if (notasFaltantes > 0 && notasFaltantes < (alunosCount || 0) * 3) {
          status = 'pendente'
        } else {
          status = 'completo'
        }

        turmasComDados.push({
          id: turma.id,
          nome: turma.nome,
          alunos: alunosCount || 0,
          status,
        })
      }

      setTurmas(turmasComDados)

      // Contar total de alunos
      const { count: totalCount } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })

      setTotalAlunos(totalCount || 0)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const numTurmas = turmas.length
  const etapaAtual = 1 // Isso pode ser calculado com base na data ou configurado de outra forma

  return (
    <div className="flex flex-col gap-6">

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Turmas', value: String(numTurmas), sub: `ativas em ${new Date().getFullYear()}` },
          { label: 'Alunos', value: String(totalAlunos), sub: 'matriculados' },
          { label: 'Etapa atual', value: `${etapaAtual}ª`, sub: 'até 05/12/2025' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className="text-xl md:text-2xl font-medium text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Turmas */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-2 transition-colors cursor-pointer" onClick={() => navigate('/turmas')}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Turmas</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/importar')
            }}
            className="text-xs text-[#185FA5] hover:underline whitespace-nowrap"
          >
            Importar planilhas →
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-center text-gray-500 text-sm">
            Carregando turmas...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-center text-red-600 text-sm">
            {error}
          </div>
        ) : turmas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-center text-gray-500 text-sm">
            Nenhuma turma encontrada
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {turmas.map(t => {
              const s = statusConfig[t.status as keyof typeof statusConfig]
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/turmas/${t.id}`)}
                  className="bg-white border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{t.alunos} alunos · Técnico em Informática</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>
                      {s.label}
                    </span>
                    <span className="text-gray-300 text-sm hidden sm:inline">›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}