import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from './components/privateroute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Turma from './pages/Turma'
import Aluno from './pages/Aluno'
import Boletim from './pages/Boletim'
import LancamentoNotas from './pages/LancamentoNotas'
import Importar from './pages/Importar'

function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/turmas" element={<PrivateLayout><Turma /></PrivateLayout>} />
        <Route path="/turmas/:id" element={<PrivateLayout><Turma /></PrivateLayout>} />
        <Route path="/aluno/:id" element={<PrivateLayout><Aluno /></PrivateLayout>} />
        <Route path="/boletins" element={<PrivateLayout><Boletim /></PrivateLayout>} />
        <Route path="/alunos/:id/boletim" element={<PrivateLayout><Boletim /></PrivateLayout>} />
        <Route path="/disciplinas" element={<PrivateLayout><LancamentoNotas /></PrivateLayout>} />
        <Route path="/turmas/:id/notas" element={<PrivateLayout><LancamentoNotas /></PrivateLayout>} />
        <Route path="/importar" element={<PrivateLayout><Importar /></PrivateLayout>} />
      </Routes>
    </BrowserRouter>
  )
}