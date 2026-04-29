import * as XLSX from 'xlsx'

export interface NotaImportada {
  nomeAluno: string
  turma: string
  disciplina: string
  etapa: 1 | 2 | 3
  nota: number
  frequencia: number
}

function calcularFrequencia(
  row: unknown[],
  colNomeAluno: number,
  colNota: number
): number {
  const inicio = colNomeAluno + 1
  const fim = colNota - 5
  if (fim < inicio) return 100

  let presencas = 0
  let total = 0

  for (let c = inicio; c <= fim; c++) {
    const val = row[c]
    if (val !== undefined && val !== null && val !== '') {
      total++
      if (val === 'P') presencas++
    }
  }

  if (total === 0) return 100
  return Math.round((presencas / total) * 100 * 10) / 10
}

function parseEtapaFromRows(
  rows: unknown[][],
  inicioIdx: number,
  etapa: 1 | 2 | 3,
  sheetName: string
): NotaImportada[] {
  const linhaCabecalhoTurma = rows[inicioIdx + 1]
  const linhaCabecalhoCols = rows[inicioIdx + 2]

  if (!linhaCabecalhoTurma || !linhaCabecalhoCols) return []

  const headerTexto = linhaCabecalhoTurma
    .map(c => String(c ?? '').trim())
    .filter(Boolean)

  const turma = headerTexto[0] ?? ''
  const disciplina = headerTexto[1] ?? sheetName

  const colNota = linhaCabecalhoCols.indexOf('etapa')
  const colNomeAluno = linhaCabecalhoCols.findIndex(c =>
  String(c).toLowerCase().includes('nome')
  ) 

  if (colNota === -1 || colNomeAluno === -1) return []

  const notas: NotaImportada[] = []

  for (let i = inicioIdx + 3; i < rows.length; i++) {
    const row = rows[i]

    if (!row || row.length === 0) break
    if (typeof row[0] === 'string' && String(row[0]).startsWith('ETAPA')) break

    const nome = String(row[colNomeAluno] ?? '').trim()

    // para ao encontrar bloco vazio ou "etc"
    if (!nome || nome.toLowerCase().includes('etc')) break

    // ignora lixo tipo cabeçalho repetido
    if (nome.toLowerCase().includes('nome')) continue

    const nota = Number(row[colNota] ?? 0)
    if (nota <= 0) continue

    const frequencia = calcularFrequencia(row, colNomeAluno, colNota)

    notas.push({
      nomeAluno: nome.trim(),
      turma,
      disciplina: disciplina.trim(),
      etapa,
      nota,
      frequencia,
    })
  }

  return notas
}

export function parseArquivoBoletim(
  buffer: ArrayBuffer,
  etapaDesejada?: 1 | 2 | 3
): NotaImportada[] {

  const workbook = XLSX.read(buffer, { type: 'array' })

  const notas: NotaImportada[] = []

  // 🔥 Agora sim: percorre TODAS as abas
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
    })

    const etapas: { idx: number; num: 1 | 2 | 3 }[] = []

    rows.forEach((row, i) => {
      const linhaTexto = row
      .map(c => String(c ?? '').toUpperCase().trim())
      .join(' ')
      if (linhaTexto.includes('ETAPA 1')) etapas.push({ idx: i, num: 1 })
      if (linhaTexto.includes('ETAPA 2')) etapas.push({ idx: i, num: 2 })
      if (linhaTexto.includes('ETAPA 3')) etapas.push({ idx: i, num: 3 })
    })

    for (const { idx, num } of etapas) {
      if (etapaDesejada && num !== etapaDesejada) continue

      notas.push(...parseEtapaFromRows(rows, idx, num, sheetName))
    }
  }

  return notas
}

