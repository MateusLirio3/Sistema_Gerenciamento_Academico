export function LoadingState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
      Carregando dados do Supabase...
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
      Erro ao carregar dados: {message}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="m-6 rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
      {text}
    </div>
  )
}