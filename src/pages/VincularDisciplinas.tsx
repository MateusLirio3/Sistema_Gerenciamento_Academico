import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import HeaderComVoltar from '../components/HeaderComVoltar'

interface Turma {
  id: string
  nome: string
  ano: number
}

interface Disciplina {
  id: string
  nome: string
  area_nome: string | null
}

export default function VincularDisciplinas() {
  const navigate = useNavigate()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null)
  const [vinculadas, setVinculadas] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingDisc, setLoadingDisc] = useState(false)
  const [busca, setBusca] = useState('')
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  // Carrega turmas e disciplinas na montagem
  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const [turmasRes, disciplinasRes] = await Promise.all([
        supabase.from('turmas').select('id,nome,ano').order('ano', { ascending: false }).order('nome'),
        supabase
          .from('disciplinas')
          .select('id, nome, areas(nome)')
          .order('nome'),
      ])

      setTurmas((turmasRes.data ?? []) as Turma[])
      setDisciplinas(
        (disciplinasRes.data ?? []).map((d: any) => ({
          id: d.id,
          nome: d.nome,
          area_nome: d.areas?.nome ?? null,
        }))
      )
      setLoading(false)
    }
    carregar()
  }, [])

  // Ao selecionar uma turma, carrega os vínculos existentes
  async function selecionarTurma(turma: Turma) {
    setTurmaSelecionada(turma)
    setFeedback(null)
    setLoadingDisc(true)

    const { data } = await supabase
      .from('turma_disciplinas')
      .select('disciplina_id')
      .eq('turma_id', turma.id)

    setVinculadas(new Set((data ?? []).map((r: any) => r.disciplina_id)))
    setLoadingDisc(false)
  }

  function toggleDisciplina(id: string) {
    setVinculadas((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodas() {
    const discFiltradas = disciplinasFiltradas.map((d) => d.id)
    const todasMarcadas = discFiltradas.every((id) => vinculadas.has(id))
    setVinculadas((prev) => {
      const next = new Set(prev)
      if (todasMarcadas) {
        discFiltradas.forEach((id) => next.delete(id))
      } else {
        discFiltradas.forEach((id) => next.add(id))
      }
      return next
    })
  }

  async function salvar() {
    if (!turmaSelecionada) return
    setSalvando(true)
    setFeedback(null)

    try {
      const turmaId = turmaSelecionada.id

      // Remove todos os vínculos atuais da turma
      const { error: delError } = await supabase
        .from('turma_disciplinas')
        .delete()
        .eq('turma_id', turmaId)

      if (delError) throw delError

      // Insere os novos vínculos
      if (vinculadas.size > 0) {
        const inserts = Array.from(vinculadas).map((disciplina_id) => ({
          turma_id: turmaId,
          disciplina_id,
        }))

        const { error: insError } = await supabase
          .from('turma_disciplinas')
          .insert(inserts)

        if (insError) throw insError
      }

      setFeedback({ tipo: 'ok', msg: `${vinculadas.size} disciplina(s) salva(s) para ${turmaSelecionada.nome}.` })
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: err.message ?? 'Erro ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  // Agrupa disciplinas filtradas por área
  const disciplinasFiltradas = disciplinas.filter((d) =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const porArea = disciplinasFiltradas.reduce<Record<string, Disciplina[]>>((acc, d) => {
    const area = d.area_nome ?? 'Sem área'
    if (!acc[area]) acc[area] = []
    acc[area].push(d)
    return acc
  }, {})

  const areasOrdenadas = Object.keys(porArea).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const todasFiltradas = disciplinasFiltradas.every((d) => vinculadas.has(d.id))

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <HeaderComVoltar titulo="Disciplinas por Turma" onVoltar={() => navigate(-1)} />
        <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <HeaderComVoltar titulo="Disciplinas por Turma" onVoltar={() => navigate(-1)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* ── Coluna esquerda: lista de turmas ── */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-700">Selecione uma turma</p>
          </div>
          <ul className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
            {turmas.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => selecionarTurma(t)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-blue-50 ${
                    turmaSelecionada?.id === t.id
                      ? 'bg-blue-50 text-[#185FA5] font-semibold border-l-2 border-[#185FA5]'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="block font-medium">{t.nome}</span>
                  <span className="text-xs text-gray-400">{t.ano}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Coluna direita: disciplinas ── */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {!turmaSelecionada ? (
            <div className="bg-white border rounded-xl p-10 text-center text-gray-400 text-sm">
              Selecione uma turma para gerenciar as disciplinas.
            </div>
          ) : loadingDisc ? (
            <div className="bg-white border rounded-xl p-10 text-center text-gray-400 text-sm">
              Carregando disciplinas...
            </div>
          ) : (
            <>
              {/* Cabeçalho com contagem e busca */}
              <div className="bg-white border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{turmaSelecionada.nome}</p>
                  <p className="text-xs text-gray-400">
                    {vinculadas.size} de {disciplinas.length} disciplinas selecionadas
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar disciplina..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-full sm:w-56 hover:border-[#185FA5] focus:outline-none focus:border-[#185FA5]"
                />
              </div>

              {/* Lista de disciplinas agrupadas por área */}
              <div className="bg-white border rounded-xl overflow-hidden max-h-[52vh] overflow-y-auto">
                {/* Linha "marcar todas" */}
                <div className="border-b px-4 py-2.5 flex items-center gap-3 bg-gray-50 sticky top-0 z-10">
                  <input
                    type="checkbox"
                    checked={todasFiltradas && disciplinasFiltradas.length > 0}
                    onChange={toggleTodas}
                    className="w-4 h-4 accent-[#185FA5] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {todasFiltradas ? 'Desmarcar todas' : 'Marcar todas'}
                    {busca && ' (filtradas)'}
                  </span>
                </div>

                {areasOrdenadas.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">
                    Nenhuma disciplina encontrada.
                  </p>
                ) : (
                  areasOrdenadas.map((area) => (
                    <div key={area}>
                      {/* Header da área */}
                      <div className="px-4 py-1.5 bg-gray-50 border-b border-t">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          {area}
                        </span>
                      </div>
                      {/* Disciplinas da área */}
                      <ul className="divide-y divide-gray-50">
                        {porArea[area].map((d) => (
                          <li key={d.id}>
                            <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={vinculadas.has(d.id)}
                                onChange={() => toggleDisciplina(d.id)}
                                className="w-4 h-4 accent-[#185FA5] cursor-pointer"
                              />
                              <span className="text-sm text-gray-800">{d.nome}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              {/* Feedback + botão salvar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {feedback ? (
                  <p
                    className={`text-sm ${
                      feedback.tipo === 'ok' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {feedback.tipo === 'ok' ? '✓ ' : '✗ '}
                    {feedback.msg}
                  </p>
                ) : (
                  <span />
                )}
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="px-5 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {salvando ? 'Salvando...' : 'Salvar vínculos'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}