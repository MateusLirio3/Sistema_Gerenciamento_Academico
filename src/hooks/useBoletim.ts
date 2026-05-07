import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // ajuste o caminho conforme seu projeto

export interface NotaDisciplina {
  disciplina_id: string;
  disciplina_nome: string;
  area_id: string;
  area_nome: string;
  frequencia: number | null; // da etapa mais recente lançada
  nota1: number | null;
  nota2: number | null;
  nota3: number | null;
  mediaFinal: number | null;
}

export interface BoletimData {
  aluno: { id: string; nome: string };
  turma: { nome: string; ano: number };
  dataEmissao: string;
  etapa: number;
  disciplinas: NotaDisciplina[];
  resumo: {
    freqGlobal: number;
    mediaEtapa1: number | null;
    mediaEtapa2: number | null;
    mediaEtapa3: number | null;
    qtdAbaixoMedia1: number;
    qtdAbaixoMedia2: number;
    qtdAbaixoMedia3: number;
    situacaoFinal: "APROVADO" | "REPROVADO" | "CURSANDO";
    crPrimeiroAno: number | null;
    crSegundoAno: number | null;
    crTerceiroAno: number | null;
    crCurso: number | null;
  };
}

const NOTA_MINIMA = 5.0;
const FREQ_MINIMA = 75;

function media(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

export function useBoletim(alunoId: string, etapa?: number) {
  const [data, setData] = useState<BoletimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etapaAtual = etapa || 3; // Alterado para 3 como padrão (última etapa)

  useEffect(() => {
    if (!alunoId) return;

    async function fetchBoletim() {
      setLoading(true);
      setError(null);

      try {
        // 1. Busca aluno + turma
        const { data: alunoData, error: alunoError } = await supabase
          .from("alunos")
          .select(`id, nome, turmas (id, nome, ano)`)
          .eq("id", alunoId)
          .single();

        if (alunoError) throw alunoError;

        const turma = alunoData.turmas as any;
        const turmaId: string = turma?.id;

        // 2. Busca todas as disciplinas vinculadas à turma (com área)
        const { data: turmaDisciplinasData, error: tdError } = await supabase
          .from("turma_disciplinas")
          .select(`
            disciplina_id,
            disciplinas (
              id,
              nome,
              areas ( id, nome )
            )
          `)
          .eq("turma_id", turmaId);

        if (tdError) throw tdError;

        // 3. Monta o mapa de disciplinas
        const map = new Map<string, NotaDisciplina>();

        for (const row of turmaDisciplinasData ?? []) {
          const disc = row.disciplinas as any;
          const area = disc?.areas as any;
          const discId: string = disc?.id;
          if (!discId) continue;

          map.set(discId, {
            disciplina_id: discId,
            disciplina_nome: disc?.nome ?? "",
            area_id: area?.id ?? "",
            area_nome: area?.nome ?? "",
            frequencia: null,
            nota1: null,
            nota2: null,
            nota3: null,
            mediaFinal: null,
          });
        }

        // 4. Busca todas as notas do aluno
        const { data: notasData, error: notasError } = await supabase
          .from("notas")
          .select(`etapa, nota, frequencia, disciplina_id`)
          .eq("aluno_id", alunoId)
          .order("etapa", { ascending: true });

        if (notasError) throw notasError;

        // 5. Preenche notas e frequências
        for (const row of notasData ?? []) {
          const discId: string = row.disciplina_id;
          if (!map.has(discId)) continue;

          const entry = map.get(discId)!;

          // Frequência: usa a frequência da etapa atual para o boletim
          if (row.etapa === etapaAtual && row.frequencia !== null) {
            entry.frequencia = row.frequencia;
          }

          // Preenche as notas por etapa
          if (row.etapa === 1) entry.nota1 = row.nota;
          if (row.etapa === 2) entry.nota2 = row.nota;
          if (row.etapa === 3) entry.nota3 = row.nota;
        }

        // 6. Se for etapa 1 ou 2, buscamos as notas parciais apenas até aquela etapa
        const disciplinas: NotaDisciplina[] = [];
        for (const disc of map.values()) {
          let notasParaMedia: number[] = [];
          
          if (etapaAtual === 1 && disc.nota1 !== null) {
            notasParaMedia = [disc.nota1];
          } else if (etapaAtual === 2) {
            notasParaMedia = [disc.nota1, disc.nota2].filter((n): n is number => n !== null);
          } else if (etapaAtual === 3) {
            notasParaMedia = [disc.nota1, disc.nota2, disc.nota3].filter((n): n is number => n !== null);
          }
          
          disc.mediaFinal = media(notasParaMedia);
          disciplinas.push(disc);
        }

        // 7. Estatísticas
        const freqs = disciplinas
          .map((d) => d.frequencia)
          .filter((f): f is number => f !== null);
        const freqGlobal = freqs.length > 0 ? (media(freqs) ?? 0) : 0;

        // Médias por etapa
        const notas1 = disciplinas.map((d) => d.nota1).filter((n): n is number => n !== null);
        const notas2 = disciplinas.map((d) => d.nota2).filter((n): n is number => n !== null);
        const notas3 = disciplinas.map((d) => d.nota3).filter((n): n is number => n !== null);

        const mediaEtapa1 = media(notas1);
        const mediaEtapa2 = media(notas2);
        const mediaEtapa3 = media(notas3);

        // Cálculo da situação final
        const abaixoMedia = disciplinas.filter(
          (d) => d.mediaFinal !== null && d.mediaFinal < NOTA_MINIMA
        ).length;

        let situacaoFinal: BoletimData["resumo"]["situacaoFinal"];
        
        if (etapaAtual === 3) {
          situacaoFinal = abaixoMedia === 0 && freqGlobal >= FREQ_MINIMA 
            ? "APROVADO" 
            : "REPROVADO";
        } else {
          situacaoFinal = "CURSANDO";
        }

        // 8. Calcular C.R (Coeficiente de Rendimento)
        const mediasFinais = disciplinas
          .map(d => d.mediaFinal)
          .filter((m): m is number => m !== null);

        const crCurso = media(mediasFinais);

        setData({
          aluno: { id: alunoData.id, nome: alunoData.nome },
          turma: { nome: turma?.nome ?? "", ano: turma?.ano ?? 0 },
          dataEmissao: new Date().toLocaleDateString("pt-BR"),
          etapa: etapaAtual,
          disciplinas,
          resumo: {
            freqGlobal: Math.round(freqGlobal),
            mediaEtapa1,
            mediaEtapa2,
            mediaEtapa3,
            qtdAbaixoMedia1: notas1.filter((n) => n < NOTA_MINIMA).length,
            qtdAbaixoMedia2: notas2.filter((n) => n < NOTA_MINIMA).length,
            qtdAbaixoMedia3: notas3.filter((n) => n < NOTA_MINIMA).length,
            situacaoFinal,
            crPrimeiroAno: mediaEtapa1,
            crSegundoAno: mediaEtapa2,
            crTerceiroAno: mediaEtapa3,
            crCurso,
          },
        });
      } catch (err: any) {
        console.error("Erro ao buscar boletim:", err);
        setError(err.message ?? "Erro ao buscar boletim");
      } finally {
        setLoading(false);
      }
    }

    fetchBoletim();
  }, [alunoId, etapaAtual]);

  return { data, loading, error };
}