import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

interface Area {
  id: string
  nome: string
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

function AreaForm({
  initial,
  loading,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: string
  loading: boolean
  error: string
  onSubmit: (nome: string) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [nome, setNome] = useState(initial ?? '')

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Nome da área</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Exatas, Humanas, Tecnologia..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none transition-colors"
          autoFocus
        />
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
          onClick={() => nome.trim() && onSubmit(nome.trim())}
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
  | { type: 'editar'; area: Area }
  | { type: 'excluir'; area: Area }

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [disciplinasPorArea, setDisciplinasPorArea] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setIsLoading(true)
    setPageError('')
    const [areasRes, disciplinasRes] = await Promise.all([
      supabase.from('areas').select('id,nome').order('nome'),
      supabase.from('disciplinas').select('area_id'),
    ])
    if (areasRes.error) { setPageError(areasRes.error.message); setIsLoading(false); return }

    setAreas(areasRes.data ?? [])

    const contagem: Record<string, number> = {}
    disciplinasRes.data?.forEach((d) => {
      if (d.area_id) contagem[d.area_id] = (contagem[d.area_id] ?? 0) + 1
    })
    setDisciplinasPorArea(contagem)
    setIsLoading(false)
  }

  function abrirModal(m: ModalState) {
    setFormError('')
    setModal(m)
  }

  async function handleCriar(nome: string) {
    setSaving(true); setFormError('')
    const { error } = await supabase.from('areas').insert({ nome })
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  async function handleEditar(nome: string) {
    if (modal.type !== 'editar') return
    setSaving(true); setFormError('')
    const { error } = await supabase.from('areas').update({ nome }).eq('id', modal.area.id)
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  async function handleExcluir() {
    if (modal.type !== 'excluir') return
    setSaving(true); setFormError('')
    const { error } = await supabase.from('areas').delete().eq('id', modal.area.id)
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setModal({ type: 'none' })
    carregar()
  }

  if (isLoading) return <LoadingState />
  if (pageError) return <ErrorState message={pageError} />

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Áreas</h2>
            <p className="mt-0.5 text-sm text-gray-400">{areas.length} área{areas.length !== 1 ? 's' : ''} cadastrada{areas.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => abrirModal({ type: 'criar' })}
            className="flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova área
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {areas.length === 0 ? (
            <EmptyState text="Nenhuma área cadastrada." />
          ) : (
            areas.map((area) => {
              const total = disciplinasPorArea[area.id] ?? 0
              const temDisciplinas = total > 0
              return (
                <div key={area.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{area.nome}</p>
                    <p className="text-sm text-gray-400">
                      {total} disciplina{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModal({ type: 'editar', area })}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Editar área"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => abrirModal({ type: 'excluir', area })}
                      disabled={temDisciplinas}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      title={temDisciplinas ? 'Área possui disciplinas — não pode ser excluída' : 'Excluir área'}
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
        <Modal title="Nova área" onClose={() => setModal({ type: 'none' })}>
          <AreaForm loading={saving} error={formError} onSubmit={handleCriar} onCancel={() => setModal({ type: 'none' })} submitLabel="Criar área" />
        </Modal>
      )}

      {modal.type === 'editar' && (
        <Modal title="Editar área" onClose={() => setModal({ type: 'none' })}>
          <AreaForm initial={modal.area.nome} loading={saving} error={formError} onSubmit={handleEditar} onCancel={() => setModal({ type: 'none' })} submitLabel="Salvar alterações" />
        </Modal>
      )}

      {modal.type === 'excluir' && (
        <Modal title="Excluir área" onClose={() => setModal({ type: 'none' })}>
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a área{' '}
              <span className="font-semibold text-gray-900">{modal.area.nome}</span>?
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