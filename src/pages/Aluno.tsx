import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import HeaderComVoltar from '../components/HeaderComVoltar'
import { Pencil, Check, X, AlertCircle } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DisciplinaRow {
  disciplina_id: string
  disciplina_nome: string
  etapas: Record<number, { id: string; nota: number; frequencia: number } | null>
}

interface EditState {
  disciplina_id: string
  etapa: number
  nota: string
  frequencia: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notaColor(v: number) {
  return v >= 7 ? 'text-green-600' : v >= 5 ? 'text-amber-600' : 'text-red-600'
}

function freqColor(v: number) {
  return v >= 75 ? 'text-green-600' : v >= 60 ? 'text-amber-600' : 'text-red-600'
}

// ─── Célula editável ──────────────────────────────────────────────────────────

function CelulaEtapa({
  row,
  etapa,
  edit,
  onEdit,
  onSave,
  onCancel,
  onChangeNota,
  onChangeFreq,
  saving,
  saveError,
}: {
  row: DisciplinaRow
  etapa: number
  edit: EditState | null
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChangeNota: (v: string) => void
  onChangeFreq: (v: string) => void
  saving: boolean
  saveError: string
}) {
  const nota = row.etapas[etapa]
  const isEditing =
    edit?.disciplina_id === row.disciplina_id && edit?.etapa === etapa

  if (isEditing) {
    return (
      <td className="px-3 py-2 text-center align-middle">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="Nota"
              value={edit!.nota}
              onChange={(e) => onChangeNota(e.target.value)}
              className="w-16 rounded border border-gray-200 px-1.5 py-1 text-center text-xs focus:border-[#185FA5] focus:outline-none"
            />
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Freq%"
              value={edit!.frequencia}
              onChange={(e) => onChangeFreq(e.target.value)}
              className="w-16 rounded border border-gray-200 px-1.5 py-1 text-center text-xs focus:border-[#185FA5] focus:outline-none"
            />
          </div>
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
          <div className="flex gap-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded bg-[#185FA5] p-1 text-white hover:bg-[#0C447C] disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </td>
    )
  }

  return (
    <td
      className="group px-3 py-2 text-center align-middle cursor-pointer hover:bg-blue-50 transition-colors"
      onClick={onEdit}
    >
      {nota ? (
        <div className="flex flex-col items-center">
          <span className={`font-medium text-sm ${notaColor(nota.nota)}`}>
            {nota.nota.toFixed(1)}
          </span>
          <span className={`text-xs ${freqColor(nota.frequencia)}`}>
            {nota.frequencia}%
          </span>
        </div>
      ) : (
        <span className="text-gray-300 group-hover:text-[#185FA5] text-lg leading-none">+</span>
      )}
    </td>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Aluno() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [nomeAluno, setNomeAluno] = useState('')
  const [nomeTurma, setNomeTurma] = useState('')
  const [turmaId, setTurmaId] = useState<string | null>(null)
  const [rows, setRows] = useState<DisciplinaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // edição
  const [edit, setEditRaw] = useState<EditState | null>(null)
  const editRef = { current: edit, set: setEditRaw }
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (id) carregarDados()
  }, [id])

  async function carregarDados() {
    try {
      setLoading(true)
      setError('')

      // aluno + turma
      const { data: alunoData, error: alunoErr } = await supabase
        .from('alunos')
        .select('nome, turma_id, turmas(nome)')
        .eq('id', id)
        .single()
      if (alunoErr) throw alunoErr

      const tid = alunoData.turma_id as string
      setNomeAluno(alunoData.nome)
      setNomeTurma((alunoData.turmas as any)?.nome ?? '')
      setTurmaId(tid)

      // disciplinas da turma
      const { data: tdData, error: tdErr } = await supabase
        .from('turma_disciplinas')
        .select('disciplina_id, disciplinas(nome)')
        .eq('turma_id', tid)
      if (tdErr) throw tdErr

      // notas do aluno
      const { data: notasData, error: notasErr } = await supabase
        .from('notas')
        .select('id, disciplina_id, etapa, nota, frequencia')
        .eq('aluno_id', id)
      if (notasErr) throw notasErr

      // montar rows
      const built: DisciplinaRow[] = (tdData ?? [])
        .map((td: any) => ({
          disciplina_id: td.disciplina_id,
          disciplina_nome: td.disciplinas?.nome ?? '',
        }))
        .sort((a: any, b: any) => a.disciplina_nome.localeCompare(b.disciplina_nome, 'pt-BR'))
        .map((d: any) => {
          const etapas: DisciplinaRow['etapas'] = { 1: null, 2: null, 3: null }
          ;(notasData ?? [])
            .filter((n) => n.disciplina_id === d.disciplina_id)
            .forEach((n) => {
              if (n.etapa && [1, 2, 3].includes(n.etapa)) {
                etapas[n.etapa] = { id: n.id, nota: n.nota ?? 0, frequencia: n.frequencia ?? 0 }
              }
            })
          return { ...d, etapas }
        })

      setRows(built)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }

  // ── Iniciar edição ──────────────────────────────────────────────────────────

  function iniciarEdicao(disciplina_id: string, etapa: number) {
    const row = rows.find((r) => r.disciplina_id === disciplina_id)
    const nota = row?.etapas[etapa]
    setSaveError('')
    setEditRaw({
      disciplina_id,
      etapa,
      nota: nota ? String(nota.nota) : '',
      frequencia: nota ? String(nota.frequencia) : '',
    })
  }

  // ── Salvar (upsert) ─────────────────────────────────────────────────────────

  async function salvar() {
    if (!edit) return
    const notaNum = parseFloat(edit.nota)
    const freqNum = parseInt(edit.frequencia)
    if (isNaN(notaNum) || isNaN(freqNum)) {
      setSaveError('Preencha nota e frequência')
      return
    }
    if (notaNum < 0 || notaNum > 10) {
      setSaveError('Nota deve ser entre 0 e 10')
      return
    }
    if (freqNum < 0 || freqNum > 100) {
      setSaveError('Frequência deve ser entre 0 e 100')
      return
    }

    setSaving(true)
    setSaveError('')

    const row = rows.find((r) => r.disciplina_id === edit.disciplina_id)
    const existing = row?.etapas[edit.etapa]

    let err: any = null

    if (existing) {
      // update
      const res = await supabase
        .from('notas')
        .update({ nota: notaNum, frequencia: freqNum })
        .eq('id', existing.id)
      err = res.error
    } else {
      // insert
      const res = await supabase.from('notas').insert({
        aluno_id: id,
        disciplina_id: edit.disciplina_id,
        etapa: edit.etapa,
        nota: notaNum,
        frequencia: freqNum,
      })
      err = res.error
    }

    setSaving(false)

    if (err) {
      setSaveError(err.message)
      return
    }

    setEditRaw(null)
    await carregarDados()
  }

  // ── Médias ──────────────────────────────────────────────────────────────────

  const todasNotas = rows.flatMap((r) =>
    Object.values(r.etapas).filter(Boolean).map((e) => e!)
  )
  const mediaGeral = todasNotas.length
    ? (todasNotas.reduce((s, n) => s + n.nota, 0) / todasNotas.length).toFixed(1)
    : null
  const freqGeral = todasNotas.length
    ? Math.round(todasNotas.reduce((s, n) => s + n.frequencia, 0) / todasNotas.length)
    : null

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 py-4">
      <HeaderComVoltar titulo={nomeAluno || 'Carregando...'} onVoltar={() => navigate(-1)} />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          Carregando...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : (
        <>
          {/* Cabeçalho do aluno */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="mt-0.5 font-medium text-gray-900">{nomeAluno}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Turma</p>
                <p className="mt-0.5 font-medium text-gray-900">{nomeTurma}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Média geral</p>
                <p className={`mt-0.5 text-lg font-bold ${mediaGeral ? notaColor(parseFloat(mediaGeral)) : 'text-gray-400'}`}>
                  {mediaGeral ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Frequência geral</p>
                <p className={`mt-0.5 text-lg font-bold ${freqGeral !== null ? freqColor(freqGeral) : 'text-gray-400'}`}>
                  {freqGeral !== null ? `${freqGeral}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de notas */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Notas por disciplina</h2>
              <p className="mt-0.5 text-xs text-gray-400">Clique em uma célula para lançar ou editar</p>
            </div>
            <div className="overflow-x-auto">
              {rows.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-400">
                  Nenhuma disciplina vinculada a esta turma.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Disciplina
                      </th>
                      {[1, 2, 3].map((e) => (
                        <th key={e} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Etapa {e}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Média
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => {
  const notasDisciplina = Object.values(row.etapas).filter(Boolean).map((e) => e!)
  const media = notasDisciplina.length
    ? notasDisciplina.reduce((s, n) => s + n.nota, 0) / notasDisciplina.length
    : null

  return (
    <tr key={row.disciplina_id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-3 font-medium text-gray-900">
        {row.disciplina_nome}
          </td>
          {[1, 2, 3].map((etapa) => (
            <CelulaEtapa
              key={etapa}
              row={row}
              etapa={etapa}
              edit={edit}
              onEdit={() => iniciarEdicao(row.disciplina_id, etapa)}
              onSave={salvar}
              onCancel={() => { setEditRaw(null); setSaveError('') }}
              onChangeNota={(v) => {                                         
                const n = parseFloat(v)                                      
                if (!isNaN(n) && (n < 0 || n > 10)) return                  
                setEditRaw((prev) => prev ? { ...prev, nota: v } : prev)     
              }}                                                             
              onChangeFreq={(v) => {                                        
                const n = parseInt(v)                                        
                if (!isNaN(n) && (n < 0 || n > 100)) return                 
                setEditRaw((prev) => prev ? { ...prev, frequencia: v } : prev) 
              }}                                                             
              saving={saving}
              saveError={edit?.disciplina_id === row.disciplina_id && edit?.etapa === etapa ? saveError : ''}
            />
          ))}
          <td className="px-3 py-2 text-center">
            {media !== null ? (
              <span className={`font-bold ${notaColor(media)}`}>
                {media.toFixed(1)}
              </span>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </td>
        </tr>
      )
    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}