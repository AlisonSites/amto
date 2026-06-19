import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';
import { maskCPF } from '../utils/masks';

export default function Usuarios() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');

  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, foto_url, nome, cpf, login, perfil, status, unidade_id, unidades(nome), faixas(nome)')
      .order('nome');
    if (error) setErro(error.message);
    else setLista(data || []);
    setCarregando(false);
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lista.filter((u) => {
      const combinaBusca = !termo || u.nome.toLowerCase().includes(termo) || u.login.toLowerCase().includes(termo);
      const combinaPerfil = !filtroPerfil || u.perfil === filtroPerfil;
      return combinaBusca && combinaPerfil;
    });
  }, [lista, busca, filtroPerfil]);

  async function confirmarExclusao() {
    setExcluindo(true);
    const { error } = await supabase.from('usuarios').delete().eq('id', excluir.id);
    setExcluindo(false);
    if (error) {
      setErro('Não foi possível excluir este usuário.');
      setExcluir(null);
      return;
    }
    setExcluir(null);
    carregar();
  }

  function iniciais(nome) {
    return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  return (
    <Layout titulo="Usuários">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Administradores e professores com acesso ao sistema.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/usuarios/novo')}>
          <IconPlus /> Novo usuário
        </button>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="card card-pad">
        <div className="tabela-toolbar">
          <div className="busca-input">
            <input
              type="text"
              placeholder="Buscar por nome ou login..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="filtros">
            <select value={filtroPerfil} onChange={(e) => setFiltroPerfil(e.target.value)}>
              <option value="">Todos os perfis</option>
              <option value="admin">Administrador</option>
              <option value="professor">Professor</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <Loader />
        ) : listaFiltrada.length === 0 ? (
          <div className="estado-vazio">
            <strong>Nenhum usuário encontrado</strong>
            Clique em "Novo usuário" para cadastrar um professor ou administrador.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>Login</th>
                  <th>Faixa</th>
                  <th>Unidade</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.foto_url ? (
                        <img className="tabela-avatar" src={u.foto_url} alt={u.nome} />
                      ) : (
                        <div className="tabela-avatar-fallback">{iniciais(u.nome)}</div>
                      )}
                    </td>
                    <td>{u.nome}</td>
                    <td>{u.login}</td>
                    <td>{u.faixas?.nome || '-'}</td>
                    <td>{u.unidades?.nome || '-'}</td>
                    <td>
                      <span className="badge badge-primary">
                        {u.perfil === 'admin' ? 'Administrador' : 'Professor'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="tabela-acoes">
                        <button
                          type="button"
                          className="btn btn-outline btn-icon"
                          onClick={() => navigate(`/usuarios/${u.id}/editar`)}
                        >
                          <IconEdit />
                        </button>
                        <button type="button" className="btn btn-danger btn-icon" onClick={() => setExcluir(u)}>
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {excluir && (
        <ConfirmDialog
          mensagem={`Tem certeza que deseja excluir o usuário "${excluir.nome}"?`}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </Layout>
  );
}
