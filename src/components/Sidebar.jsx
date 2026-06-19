import { NavLink } from 'react-router-dom';
import {
  IconDashboard,
  IconUsers,
  IconBuilding,
  IconUserCog,
  IconCalendarPlus,
  IconListChecks,
  IconRibbon,
  IconUser,
  IconLogout,
  IconClose,
} from './Icons';
import { useAuth } from '../context/AuthContext';

const ITENS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, roles: ['admin', 'professor'] },
  { to: '/alunos', label: 'Alunos', icon: IconUsers, roles: ['admin', 'professor'] },
  { to: '/unidades', label: 'Unidades', icon: IconBuilding, roles: ['admin'] },
  { to: '/usuarios', label: 'Usuários', icon: IconUserCog, roles: ['admin'] },
  { to: '/exames/cadastro', label: 'Cadastrar Exames', icon: IconCalendarPlus, roles: ['admin'] },
  { to: '/exames/inscricao', label: 'Exames', icon: IconListChecks, roles: ['admin', 'professor'] },
  { to: '/exames', label: 'Exames', icon: IconListChecks, roles: ['aluno'] },
  { to: '/faixas', label: 'Faixas', icon: IconRibbon, roles: ['admin'] },
  { to: '/perfil', label: 'Perfil', icon: IconUser, roles: ['admin', 'professor', 'aluno'] },
];

export default function Sidebar({ aberta, onClose }) {
  const { user, logout } = useAuth();
  const itensVisiveis = ITENS.filter((i) => i.roles.includes(user?.tipo));

  return (
    <>
      <div className={`overlay-mobile ${aberta ? 'visivel' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${aberta ? 'aberta' : ''}`}>
        <div className="sidebar-brand">
          <div className="marca">AM</div>
          <div>
            <div className="titulo">AMTO</div>
            <div className="subtitulo">Associação Macauense de Taekwondo</div>
          </div>
          <button
            type="button"
            className="modal-close"
            style={{ color: '#fff', marginLeft: 'auto', display: aberta ? 'flex' : 'none' }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <nav className="sidebar-nav">
          {itensVisiveis.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `item ${isActive ? 'ativo' : ''}`}
            >
              <span className="icone">
                <item.icon />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sair" onClick={logout}>
            <IconLogout />
            Sair do sistema
          </button>
        </div>
      </aside>
    </>
  );
}
