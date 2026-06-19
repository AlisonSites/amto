import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alunos from './pages/Alunos';
import AlunoForm from './pages/AlunoForm';
import Unidades from './pages/Unidades';
import Usuarios from './pages/Usuarios';
import UsuarioForm from './pages/UsuarioForm';
import Faixas from './pages/Faixas';
import ExamesCadastro from './pages/ExamesCadastro';
import ExamesInscricao from './pages/ExamesInscricao';
import AlunoExames from './pages/AlunoExames';
import Perfil from './pages/Perfil';
import PerfilAluno from './pages/PerfilAluno';

function RotaInicial() {
  const { user, loading } = useAuth();
  if (loading) return <Loader texto="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.tipo === 'aluno') return <Navigate to="/perfil" replace />;
  return <Navigate to="/dashboard" replace />;
}

function PerfilRoteado() {
  const { user } = useAuth();
  return user?.tipo === 'aluno' ? <PerfilAluno /> : <Perfil />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RotaInicial />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'professor']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alunos"
            element={
              <ProtectedRoute roles={['admin', 'professor']}>
                <Alunos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alunos/novo"
            element={
              <ProtectedRoute roles={['admin', 'professor']}>
                <AlunoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alunos/:id/editar"
            element={
              <ProtectedRoute roles={['admin', 'professor']}>
                <AlunoForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unidades"
            element={
              <ProtectedRoute roles={['admin']}>
                <Unidades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute roles={['admin']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsuarioForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsuarioForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faixas"
            element={
              <ProtectedRoute roles={['admin']}>
                <Faixas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exames/cadastro"
            element={
              <ProtectedRoute roles={['admin']}>
                <ExamesCadastro />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exames/inscricao"
            element={
              <ProtectedRoute roles={['admin', 'professor']}>
                <ExamesInscricao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exames"
            element={
              <ProtectedRoute roles={['aluno']}>
                <AlunoExames />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute roles={['admin', 'professor', 'aluno']}>
                <PerfilRoteado />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
