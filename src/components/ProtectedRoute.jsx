import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege uma rota exigindo usuário autenticado e, opcionalmente,
 * restringe o acesso a determinados perfis (roles).
 * roles: array com algum de 'admin' | 'professor' | 'aluno'
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.tipo)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
