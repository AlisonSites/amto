import { useState } from 'react';
import Sidebar from './Sidebar';
import { IconMenu } from './Icons';
import { useAuth } from '../context/AuthContext';

const ROTULO_PERFIL = { admin: 'Administrador', professor: 'Professor', aluno: 'Aluno' };

export default function Layout({ titulo, children }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const { user } = useAuth();

  const iniciais = (user?.nome || '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar aberta={sidebarAberta} onClose={() => setSidebarAberta(false)} />

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarAberta(true)}
            aria-label="Abrir menu"
          >
            <IconMenu />
          </button>

          <span className="topbar-titulo">{titulo}</span>

          <div className="topbar-usuario">
            <div>
              <div className="nome">{user?.nome}</div>
              <div className="perfil">{ROTULO_PERFIL[user?.tipo] || user?.tipo}</div>
            </div>
            {user?.foto_url ? (
              <img className="avatar" src={user.foto_url} alt={user.nome} />
            ) : (
              <div className="avatar-fallback">{iniciais}</div>
            )}
          </div>
        </header>

        <main className="conteudo">{children}</main>
      </div>
    </div>
  );
}
