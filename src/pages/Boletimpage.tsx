import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { useParams, useNavigate } from "react-router-dom";
import { useBoletim } from "../hooks/useBoletim";
import BoletimTemplate from "../components/Boletimtemplate";

export default function BoletimPage() {
  const { alunoID, etapa } = useParams<{
    alunoID: string;
    etapa?: string;
  }>();

  const navigate = useNavigate();
  const onClose = () => navigate(-1);

  // Etapa padrão = 3
  const etapaNum = etapa ? parseInt(etapa) : 3;

  const { data, loading, error } = useBoletim(
    alunoID ?? "",
    etapaNum
  );

  const boletimRef = useRef<HTMLDivElement>(null);

  const [exportando, setExportando] = useState(false);

  async function handleExportPDF() {
  if (!boletimRef.current || !data) return;

  setExportando(true);

  const style = document.createElement("style");

  try {
    const element = boletimRef.current;

    await new Promise((resolve) => setTimeout(resolve, 300));

    const opt = {
      margin: 0,

      filename: `Boletim_${data.aluno.nome.replace(
        /\s+/g,
        "_"
      )}_${etapaNum}a_Etapa_${data.turma.ano}.pdf`,

      image: {
        type: "jpeg",
        quality: 1,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      },

      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
      },
    };

    style.innerHTML = `
      * {
        color: rgb(0,0,0) !important;
        border-color: rgb(0,0,0) !important;
      }

      .bg-gray-50 { background-color: rgb(249,250,251) !important; }
      .bg-gray-100 { background-color: rgb(243,244,246) !important; }
      .bg-gray-200 { background-color: rgb(229,231,235) !important; }

      .bg-blue-50 { background-color: rgb(239,246,255) !important; }
      .bg-blue-100 { background-color: rgb(219,234,254) !important; }

      .text-blue-700 { color: rgb(29,78,216) !important; }
      .text-blue-800 { color: rgb(30,64,175) !important; }

      .text-red-700 { color: rgb(185,28,28) !important; }

      .bg-white {
        background-color: rgb(255,255,255) !important;
      }
    `;

    document.head.appendChild(style);

    const rect = element.getBoundingClientRect();

    // sobrescreve as opções de canvas com posição exata do elemento
    (opt.html2canvas as any).x = rect.left + window.scrollX;
    (opt.html2canvas as any).y = rect.top + window.scrollY;

    await html2pdf()
      .set(opt)
      .from(element)
      .save();

  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert("Erro ao gerar PDF. Tente novamente.");
  } finally {
    setExportando(false);

    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  }
}


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Carregando boletim...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-600 text-sm">
          Erro ao carregar boletim: {error}
        </p>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-200 py-4 px-4">

      {/* Toolbar */}
      <div className="flex gap-3 self-start mb-4">

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          ← Voltar
        </button>

        <button
          onClick={handleExportPDF}
          disabled={exportando}
          className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exportando
            ? "⏳ Gerando PDF..."
            : "⬇ Baixar PDF"}
        </button>
      </div>

      {/* Preview */}
      <div className="shadow-2xl bg-white overflow-visible max-w-full">

        <BoletimTemplate
          ref={boletimRef}
          data={data}
        />
      </div>
    </div>
  );
}