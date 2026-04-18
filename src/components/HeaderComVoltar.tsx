interface HeaderComVoltarProps {
  titulo: string
  onVoltar: () => void
}

export default function HeaderComVoltar({ titulo, onVoltar }: HeaderComVoltarProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onVoltar}
        className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
        aria-label="Voltar"
      >
        ←
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
    </div>
  )
}
