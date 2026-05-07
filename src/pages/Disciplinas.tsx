import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

interface Area {
  id: string
  nome: string
}

interface Disciplina {
  id: string
  nome: string
  area_id: string | null
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function DisciplinaForm({
  initial,
  areas,
  loading,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: { nome: string; area_id: string | null }
  areas: Area[]
  loading: boolean
  error: string
  onSubmit: (nome: string, area_id: string | null) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [areaId, setAreaId] = useState<string>(initial?.area_id ?? '')

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Nome da disciplina</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Algoritmos, Banco de Dados..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none transition-colors"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Área</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none transition-colors bg-white"
        >
          <option value="">Sem área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => nome.trim() && onSubmit(nome.trim(), areaId || null)}
          disabled={loading || !nome.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'criar' }
  | { type: 'editar'; disciplina: Disciplina }
  | { type: 'excluir'; disciplina: Disciplina }

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [notasPorDisciplina, setNotasPorDisciplina] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [filtroArea, setFiltroArea] = useState<string>('todas')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setIsLoading(true)
    setPageError('')
    const [discRes, areasRes, notasRes] = await Promise.all([
      supabase.from('disciplinas').select('id,nome,area_id').order('nome'),
      supabase.from('areas').select('id,nome').order('nome'),
      supabase.from('notas').select('disciplina_id'),
    ])
    if (discRes.error) { setPageError(discRes.error.message); setIsLoading(false); return }
    setDisciplinas(discRes.data ?? [])
    setAreas(areasRes.data ?? [])

    const contagem: Record<string, number> = {}
    notasRes.data?.forEach((n) => {
      if (n.disciplina_id) contagem[n.disciplina_id] = (contagem[n.disciplina_id] ?? 0) + 1
    })
    setNotasPorDisciplina(contagem)
    setIsLoading(false)
  }

  function abrirModal(m: ModalState) {
    setFormError('')
    setModal(m)
  }

  async function handleCriar(nome: string, area_id: string | null) {
    setSaving(true); setFormError('')
    const { error } = await supabase.from('disciplinas').insert({ nome, area_id })
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  async function handleEditar(nome: string, area_id: string | null) {
    if (modal.type !== 'editar') return
    setSaving(true); setFormError('')
    const { error } = await supabase.from('disciplinas').update({ nome, area_id }).eq('id', modal.disciplina.id)
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  async function handleExcluir() {
    if (modal.type !== 'excluir') return
    setSaving(true); setFormError('')
    const { error } = await supabase.from('disciplinas').delete().eq('id', modal.disciplina.id)
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  const disciplinasFiltradas = filtroArea === 'todas'
    ? disciplinas
    : disciplinas.filter((d) => d.area_id === filtroArea)

  if (isLoading) return <LoadingState />
  if (pageError) return <ErrorState message={pageError} />

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Disciplinas</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              {disciplinasFiltradas.length} disciplina{disciplinasFiltradas.length !== 1 ? 's' : ''}
              {filtroArea !== 'todas' && ' nesta área'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#185FA5] focus:outline-none transition-colors bg-white"
            >
              <option value="todas">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
            <button
              onClick={() => abrirModal({ type: 'criar' })}
              className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova disciplina
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {disciplinasFiltradas.length === 0 ? (
            <EmptyState text="Nenhuma disciplina cadastrada." />
          ) : (
            disciplinasFiltradas.map((disc) => {
              const area = areas.find((a) => a.id === disc.area_id)
              const totalNotas = notasPorDisciplina[disc.id] ?? 0
              const temNotas = totalNotas > 0
              return (
                <div key={disc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{disc.nome}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {area ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {area.nome}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sem área</span>
                      )}
                      <span className="text-xs text-gray-400">{totalNotas} nota{totalNotas !== 1 ? 's' : ''} lançada{totalNotas !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModal({ type: 'editar', disciplina: disc })}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Editar disciplina"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => abrirModal({ type: 'excluir', disciplina: disc })}
                      disabled={temNotas}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      title={temNotas ? 'Disciplina possui notas lançadas — não pode ser excluída' : 'Excluir disciplina'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {modal.type === 'criar' && (
        <Modal title="Nova disciplina" onClose={() => setModal({ type: 'none' })}>
          <DisciplinaForm areas={areas} loading={saving} error={formError} onSubmit={handleCriar} onCancel={() => setModal({ type: 'none' })} submitLabel="Criar disciplina" />
        </Modal>
      )}

      {modal.type === 'editar' && (
        <Modal title="Editar disciplina" onClose={() => setModal({ type: 'none' })}>
          <DisciplinaForm
            initial={{ nome: modal.disciplina.nome, area_id: modal.disciplina.area_id }}
            areas={areas}
            loading={saving}
            error={formError}
            onSubmit={handleEditar}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Salvar alterações"
          />
        </Modal>
      )}

      {modal.type === 'excluir' && (
        <Modal title="Excluir disciplina" onClose={() => setModal({ type: 'none' })}>
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a disciplina{' '}
              <span className="font-semibold text-gray-900">{modal.disciplina.nome}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal({ type: 'none' })} disabled={saving} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleExcluir} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}