import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children?: React.ReactNode
}

export default function PrivateRoute({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!authed) return <Navigate to="/login" />

  // Suporta tanto children direto quanto Outlet (para uso como Route element)
  return children ? <>{children}</> : <Outlet />
}