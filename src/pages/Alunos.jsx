import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';
import { maskCPF, formatarData } from '../utils/masks';

export default function Alunos() {
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'professor';
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');

    let query = supabase
      .from('alunos')
      .select('id, foto_url, nome_completo, cpf, status, data_inicio, unidade_id, unidades(nome), faixas(nome)')
      .order('nome_completo');

    if (isProfessor) query = query.eq('unidade_id', user.unidade_id);

    const [{ data, error }, { data: unidadesData }] = await Promise.all([
      query,
      isProfessor ? Promise.resolve({ data: [] }) : supabase.from('unidades').select('id, nome').order('nome'),
    ]);

    if (error) setErro(error.message);
    else setAlunos(data || []);
    setUnidades(unidadesData || []);
    setCarregando(false);
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos.filter((a) => {
      const combinaBusca =
        !termo ||
        a.nome_completo.toLowerCase().includes(termo) ||
        maskCPF(a.cpf).includes(termo) ||
        a.cpf.includes(termo.replace(/\D/g, ''));
      const combinaUnidade = !filtroUnidade || a.unidade_id === filtroUnidade;
      const combinaStatus = !filtroStatus || a.status === filtroStatus;
      return combinaBusca && combinaUnidade && combinaStatus;
    });
  }, [alunos, busca, filtroUnidade, filtroStatus]);

  async function confirmarExclusao() {
    setExcluindo(true);
    const { error } = await supabase.from('alunos').delete().eq('id', excluir.id);
    setExcluindo(false);
    if (error) {
      setErro('Não foi possível excluir o aluno.');
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
    <Layout titulo="Alunos">
      <div className="page-header">
        <div>
          <h1>Alunos</h1>
          <p>{isProfessor ? 'Alunos cadastrados na sua unidade.' : 'Todos os alunos cadastrados na AMTO.'}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/alunos/novo')}>
          <IconPlus /> Novo aluno
        </button>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="card card-pad">
        <div className="tabela-toolbar">
          <div className="busca-input">
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="filtros">
            {!isProfessor && (
              <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)}>
                <option value="">Todas as unidades</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            )}
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <Loader />
        ) : listaFiltrada.length === 0 ? (
          <div className="estado-vazio">
            <strong>Nenhum aluno encontrado</strong>
            Ajuste os filtros ou cadastre um novo aluno.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>CPF</th>
                  {!isProfessor && <th>Unidade</th>}
                  <th>Faixa</th>
                  <th>Início</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.foto_url ? (
                        <img className="tabela-avatar" src={a.foto_url} alt={a.nome_completo} />
                      ) : (
                        <div className="tabela-avatar-fallback">{iniciais(a.nome_completo)}</div>
                      )}
                    </td>
                    <td>{a.nome_completo}</td>
                    <td>{maskCPF(a.cpf)}</td>
                    {!isProfessor && <td>{a.unidades?.nome || '-'}</td>}
                    <td>{a.faixas?.nome || '-'}</td>
                    <td>{formatarData(a.data_inicio)}</td>
                    <td>
                      <span className={`badge ${a.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                        {a.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="tabela-acoes">
                        <button
                          type="button"
                          className="btn btn-outline btn-icon"
                          onClick={() => navigate(`/alunos/${a.id}/editar`)}
                        >
                          <IconEdit />
                        </button>
                        <button type="button" className="btn btn-danger btn-icon" onClick={() => setExcluir(a)}>
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
          mensagem={`Tem certeza que deseja excluir o aluno "${excluir.nome_completo}"? Esta ação não pode ser desfeita.`}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </Layout>
  );
}
