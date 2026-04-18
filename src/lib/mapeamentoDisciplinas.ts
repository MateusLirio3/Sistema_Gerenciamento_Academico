export const DISCIPLINA_PARA_AREA: Record<string, string> = {
  // Formação Técnica
  'Banco de Dados I': 'Formação Técnica',
  'Design Gráfico': 'Formação Técnica',
  'Ferramentas para WEB II': 'Formação Técnica',
  'Gestão e Empreendedorismo': 'Formação Técnica',
  'Linguagem de Programação II': 'Formação Técnica',
  'Lingaugem da Programação': 'Formação Técnica', // typo da planilha
  'Modelagem de Dados II': 'Formação Técnica',
  'Montagem e Manutenção': 'Formação Técnica',
  'Redes de Computadores': 'Formação Técnica',
  'Psicologia das Relações Humanas': 'Formação Técnica',
  'Prática de Laboratório': 'Formação Técnica',

  // Ciências da Natureza
  'Biologia': 'Ciências da Natureza',
  'Física': 'Ciências da Natureza',
  'Química': 'Ciências da Natureza',

  // Linguagens
  'Língua Portuguesa': 'Linguagens e Suas Tecnologias',
  'Literatura': 'Linguagens e Suas Tecnologias',
  'Aprofundamento em Língua Inglesa': 'Linguagens e Suas Tecnologias',
  'Aprofundamento em Produção Oral': 'Linguagens e Suas Tecnologias',

  // Ciências Humanas
  'Filosofia': 'Ciências Humanas e Sociais Aplicadas',
  'Geografia': 'Ciências Humanas e Sociais Aplicadas',
  'História': 'Ciências Humanas e Sociais Aplicadas',
  'Sociologia': 'Ciências Humanas e Sociais Aplicadas',

  // Matemática
  'Matemática': 'Matemática e Suas Tecnologias',
  'Math+': 'Matemática e Suas Tecnologias',
}

export function getArea(disciplina: string): string {
  return DISCIPLINA_PARA_AREA[disciplina] ?? 'Sem Área'
}