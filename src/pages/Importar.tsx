import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseArquivoBoletim } from '../lib/parsers/parseBoletim'
import { importarNotas } from '../lib/importar'
import HeaderComVoltar from '../components/HeaderComVoltar'
import type { NotaImportada } from '../lib/parsers/parseBoletim'

export default function Importar() {
  const navigate = useNavigate()
  const [arquivos, setArquivos] = useState<File[]>([])
  const [preview, setPreview] = useState<NotaImportada[]>([])
  const [progresso, setProgresso] = useState(0)
  const [total, setTotal] = useState(0)
  const [erros, setErros] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'preview' | 'importando' | 'concluido'>('idle')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'))
    setArquivos(files)
    setStatus('idle')
    setPreview([])
  }, [])

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.name.endsWith('.xlsx'))
    setArquivos(files)
    setStatus('idle')
    setPreview([])
  }

  async function handlePreview() {
    const todasNotas: NotaImportada[] = []
    for (const file of arquivos) {
      const buffer = await file.arrayBuffer()
      const notas = parseArquivoBoletim(buffer)
      todasNotas.push(...notas)
    }
    setPreview(todasNotas)
    setStatus('preview')
  }

  async function handleImportar() {
    setStatus('importando')
    setProgresso(0)
    setTotal(preview.length)

    const errosImport = await importarNotas(preview, (atual, tot) => {
      setProgresso(atual)
      setTotal(tot)
    })

    setErros(errosImport)
    setStatus('concluido')
  }

  function handleReset() {
    setArquivos([])
    setPreview([])
    setErros([])
    setProgresso(0)
    setTotal(0)
    setStatus('idle')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">

      {/* Header */}
      <HeaderComVoltar 
        titulo="Importar planilhas"
        onVoltar={() => navigate('/')}
      />
      <p className="text-sm text-gray-400 -mt-4">
        Selecione um ou mais arquivos .xlsx para importar as notas
      </p>

      {/* Drop zone */}
      {status === 'idle' && (
        <label
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#185FA5] hover:bg-blue-50 transition-colors group"
        >
          <input
            type="file"
            accept=".xlsx"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          {arquivos.length === 0 ? (
            <>
              <p className="text-sm text-gray-500">Arraste os arquivos .xlsx aqui</p>
              <p className="text-xs text-gray-400 mt-1">ou clique para selecionar · múltiplos arquivos permitidos</p>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {arquivos.map(f => (
                <p key={f.name} className="text-sm text-[#185FA5] font-medium">{f.name}</p>
              ))}
              <p className="text-xs text-gray-400 mt-1">{arquivos.length} arquivo(s) selecionado(s)</p>
            </div>
          )}
        </label>
      )}

      {/* Botão pré-visualizar */}
      {arquivos.length > 0 && status === 'idle' && (
        <button
          className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={handlePreview}
        >
          Pré-visualizar dados
        </button>
      )}

      {/* Preview */}
      {status === 'preview' && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{preview.length} registros encontrados</p>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
                Cancelar
              </button>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {['Aluno', 'Turma', 'Disciplina', 'Etapa', 'Nota', 'Freq.'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((n, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900 max-w-[160px] truncate">{n.nomeAluno}</td>
                      <td className="px-4 py-2 text-gray-600">{n.turma}</td>
                      <td className="px-4 py-2 text-gray-600 max-w-[160px] truncate">{n.disciplina}</td>
                      <td className="px-4 py-2 text-gray-600">{n.etapa}ª</td>
                      <td className="px-4 py-2 text-gray-900 font-medium">{n.nota}</td>
                      <td className="px-4 py-2 text-gray-600">{n.frequencia}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            className="bg-[#185FA5] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0C447C] transition-colors"
            onClick={handleImportar}
          >
            Confirmar importação
          </button>
        </>
      )}

      {/* Progresso */}
      {status === 'importando' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Importando registros...</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-[#185FA5] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (progresso / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progresso} de {total} registros</p>
        </div>
      )}

      {/* Concluído */}
      {status === 'concluido' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Importação concluída</p>
              <p className="text-xs text-gray-400">{preview.length - erros.length} de {preview.length} registros inseridos</p>
            </div>
          </div>

          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600 max-h-48 overflow-y-auto">
              <p className="font-medium mb-1">{erros.length} erro(s):</p>
              {erros.map((e, i) => <p key={i} className="mb-0.5">{e}</p>)}
            </div>
          )}

          <button
            onClick={handleReset}
            className="text-sm text-[#185FA5] hover:underline self-start"
          >
            Importar mais arquivos
          </button>
        </div>
      )}

    </div>
  )
}