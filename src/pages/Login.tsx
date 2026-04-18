import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorretos')
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6 sm:py-0">
      <div className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-6 md:p-8 w-full max-w-sm shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#185FA5] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-none">ISEPAM</p>
            <p className="text-xs text-gray-400 leading-none mt-1">Sistema de Boletins</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 md:gap-4">
          {erro && (
            <div className="text-xs md:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Email</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] transition-colors"
              type="email"
              placeholder="coordenador@isepam.edu.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Senha</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] transition-colors"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button
            className="bg-[#185FA5] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0C447C] transition-colors disabled:opacity-50 mt-1"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <p className="text-center text-xs md:text-[11px] text-gray-300 mt-6 md:mt-8">
          ISEPAM — Educação Profissional Técnica de Nível Médio
        </p>
      </div>
    </div>
  )
}