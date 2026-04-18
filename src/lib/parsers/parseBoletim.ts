import * as XLSX from 'xlsx'

export interface NotaImportada {
  nomeAluno: string
  turma: string
  disciplina: string
  etapa: 1 | 2 | 3
  nota: number
  frequencia: number
}

function calcularFrequencia(row: unknown[], colNomeAluno: number, colNota: number): number {
  // Presença está entre colNomeAluno+1 e colNota-5 (antes de I1,I2,A1,A2,Etapa)
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
  etapa: 1 | 2 | 3
): NotaImportada[] {
  // Linha 0: ['ETAPA X']
  // Linha 1: ['INF31', 'Disciplina', ...]
  // Linha 2: [null, 'Nome Aluno', null, data1, null, ... 'I1','I2','A1','A2','Etapa']
  // Linha 3+: alunos

  const linhaCabecalhoTurma = rows[inicioIdx + 1]
  const linhaCabecalhoCols = rows[inicioIdx + 2]

  if (!linhaCabecalhoTurma || !linhaCabecalhoCols) return []

  const turma = String(linhaCabecalhoTurma[0] ?? '')
  const disciplina = String(linhaCabecalhoTurma[1] ?? '')

  // Descobre índice da coluna 'Etapa' e 'Nome Aluno'
  const colNota = linhaCabecalhoCols.indexOf('Etapa')
  const colNomeAluno = linhaCabecalhoCols.indexOf('Nome Aluno')

  if (colNota === -1 || colNomeAluno === -1) return []

  const notas: NotaImportada[] = []

  for (let i = inicioIdx + 3; i < rows.length; i++) {
    const row = rows[i]

    // Para quando achar linha vazia ou próxima ETAPA
    if (!row || row.length === 0) break
    if (typeof row[0] === 'string' && String(row[0]).startsWith('ETAPA')) break

    const num = row[0]
    const nome = row[colNomeAluno]

    if (!num || !nome || typeof nome !== 'string') continue

    const nota = Number(row[colNota] ?? 0)
    if (nota <= 0) continue

    const frequencia = calcularFrequencia(row, colNomeAluno, colNota)

    notas.push({
      nomeAluno: nome.trim(),
      turma,
      disciplina,
      etapa,
      nota,
      frequencia,
    })
  }

  return notas
}

export function parseArquivoBoletim(buffer: ArrayBuffer): NotaImportada[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

  // Encontra índices das etapas
  const etapas: { idx: number; num: 1 | 2 | 3 }[] = []
  rows.forEach((row, i) => {
    const val = row[0]
    if (val === 'ETAPA 1') etapas.push({ idx: i, num: 1 })
    if (val === 'ETAPA 2') etapas.push({ idx: i, num: 2 })
    if (val === 'ETAPA 3') etapas.push({ idx: i, num: 3 })
  })

  const notas: NotaImportada[] = []
  for (const { idx, num } of etapas) {
    notas.push(...parseEtapaFromRows(rows, idx, num))
  }

  return notas
}