import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { IconCheck, IconCalendarCheck } from '../components/Icons';
import { maskCPF, formatarData } from '../utils/masks';

export default function ExamesInscricao() {
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'professor';

  const [exames, setExames] = useState([]);
  const [contagemPorExame, setContagemPorExame] = useState({});
  const [unidades, setUnidades] = useState([]);
  const [carregandoExames, setCarregandoExames] = useState(true);
  const [erro, setErro] = useState('');

  const [exameModal, setExameModal] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [inscritosIds, setInscritosIds] = useState(new Set());
  const [carregandoModal, setCarregandoModal] = useState(false);
  const [erroModal, setErroModal] = useState('');
  const [processandoId, setProcessandoId] = useState(null);

  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');

  const bloqueado = exameModal?.status === 'concluido';

  useEffect(() => {
    carregarBase();
  }, []);

  async function carregarBase() {
    setCarregandoExames(true);
    setErro('');

    let queryContagem = supabase.from('exame_inscricoes').select('exame_id, unidade_id');
    if (isProfessor) queryContagem = queryContagem.eq('unidade_id', user.unidade_id);

    const [{ data: examesData, error: errExames }, { data: unidadesData }, { data: contagemData }] = await Promise.all([
      supabase.from('exames').select('*').order('data_exame', { ascending: false }),
      isProfessor ? Promise.resolve({ data: [] }) : supabase.from('unidades').select('id, nome').order('nome'),
      queryContagem,
    ]);

    if (errExames) setErro(errExames.message);

    const contagem = {};
    (contagemData || []).forEach((row) => {
      contagem[row.exame_id] = (contagem[row.exame_id] || 0) + 1;
    });

    setExames(examesData || []);
    setUnidades(unidadesData || []);
    setContagemPorExame(contagem);
    setCarregandoExames(false);
  }

  async function abrirExame(exame) {
    setExameModal(exame);
    setBusca('');
    setFiltroUnidade('');
    setErroModal('');
    setCarregandoModal(true);

    let queryAlunos = supabase
      .from('alunos')
      .select('id, nome_completo, cpf, foto_url, unidade_id, faixa_id, status, unidades(nome), faixas(nome)')
      .eq('status', 'ativo')
      .order('nome_completo');
    if (isProfessor) queryAlunos = queryAlunos.eq('unidade_id', user.unidade_id);

    const [{ data: alunosData, error: errAlunos }, { data: inscricoesData, error: errInsc }] = await Promise.all([
      queryAlunos,
      supabase.from('exame_inscricoes').select('aluno_id').eq('exame_id', exame.id),
    ]);

    if (errAlunos) setErroModal(errAlunos.message);
    if (errInsc) setErroModal(errInsc.message);

    setAlunos(alunosData || []);
    setInscritosIds(new Set((inscricoesData || []).map((i) => i.aluno_id)));
    setCarregandoModal(false);
  }

  function fecharModal() {
    setExameModal(null);
    carregarBase();
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos.filter((a) => {
      const combinaBusca = !termo || a.nome_completo.toLowerCase().includes(termo) || a.cpf.includes(termo.replace(/\D/g, ''));
      const combinaUnidade = !filtroUnidade || a.unidade_id === filtroUnidade;
      return combinaBusca && combinaUnidade;
    });
  }, [alunos, busca, filtroUnidade]);

  async function alternarInscricao(aluno) {
    if (!exameModal || bloqueado) return;
    setProcessandoId(aluno.id);
    setErroModal('');

    const jaInscrito = inscritosIds.has(aluno.id);

    if (jaInscrito) {
      const { error } = await supabase
        .from('exame_inscricoes')
        .delete()
        .eq('exame_id', exameModal.id)
        .eq('aluno_id', aluno.id);
      if (error) setErroModal('Não foi possível remover a inscrição.');
      else {
        const novoSet = new Set(inscritosIds);
        novoSet.delete(aluno.id);
        setInscritosIds(novoSet);
      }
    } else {
      const { error } = await supabase.from('exame_inscricoes').insert({
        exame_id: exameModal.id,
        aluno_id: aluno.id,
        faixa_atual_id: aluno.faixa_id || null,
        unidade_id: aluno.unidade_id,
      });
      if (error) setErroModal('Não foi possível inscrever o aluno.');
      else setInscritosIds(new Set(inscritosIds).add(aluno.id));
    }
    setProcessandoId(null);
  }

  return (
    <Layout titulo="Exames">
      <div className="page-header">
        <div>
          <h1>Exames - Inscrições</h1>
          <p>Clique em uma data de exame para ver e inscrever os alunos.</p>
        </div>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      {carregandoExames ? (
        <Loader />
      ) : exames.length === 0 ? (
        <div className="card card-pad">
          <div className="estado-vazio">
            <strong>Nenhum exame cadastrado</strong>
            Peça ao administrador para cadastrar uma data de exame.
          </div>
        </div>
      ) : (
        <div className="exames-grid">
          {exames.map((ex) => {
            const concluido = ex.status === 'concluido';
            return (
              <div
                key={ex.id}
                className={`card card-faixa-top exame-card ${concluido ? 'concluido' : ''}`}
                onClick={() => abrirExame(ex)}
              >
                <span className={`badge ${concluido ? 'badge-success' : 'badge-primary'}`} style={{ alignSelf: 'flex-start' }}>
                  {concluido ? 'Concluído' : 'Agendado'}
                </span>
                <div className="exame-card-data">
                  <IconCalendarCheck />
                  {formatarData(ex.data_exame)}
                </div>
                <div className="exame-card-desc">{ex.descricao || 'Exame de graduação'}</div>
                <div className="exame-card-rodape">
                  <span className="exame-card-contagem">{contagemPorExame[ex.id] || 0} inscrito(s)</span>
                  <span className="btn btn-outline btn-sm">Ver alunos</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {exameModal && (
        <Modal
          titulo={`Inscrições - ${formatarData(exameModal.data_exame)}${exameModal.descricao ? ` · ${exameModal.descricao}` : ''}`}
          tamanho="lg"
          onClose={fecharModal}
        >
          {bloqueado && (
            <div className="alert alert-info modal-aviso-bloqueado">
              Este exame já foi marcado como concluído. As inscrições estão bloqueadas para edição.
            </div>
          )}

          {erroModal && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{erroModal}</div>}

          <div className="tabela-toolbar">
            <div className="busca-input">
              <input
                type="text"
                placeholder="Buscar aluno por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {!isProfessor && (
              <div className="filtros">
                <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)}>
                  <option value="">Todas as unidades</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {carregandoModal ? (
            <Loader />
          ) : listaFiltrada.length === 0 ? (
            <div className="estado-vazio">
              <strong>Nenhum aluno encontrado</strong>
              Ajuste os filtros de busca.
            </div>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    {!isProfessor && <th>Unidade</th>}
                    <th>Faixa</th>
                    <th style={{ textAlign: 'right' }}>Inscrição</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((a) => {
                    const inscrito = inscritosIds.has(a.id);
                    return (
                      <tr key={a.id}>
                        <td>{a.nome_completo}</td>
                        <td>{maskCPF(a.cpf)}</td>
                        {!isProfessor && <td>{a.unidades?.nome || '-'}</td>}
                        <td>{a.faixas?.nome || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${inscrito ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => alternarInscricao(a)}
                            disabled={processandoId === a.id || bloqueado}
                            title={bloqueado ? 'Exame concluído: inscrições bloqueadas' : ''}
                          >
                            {inscrito && <IconCheck />}
                            {processandoId === a.id ? 'Aguarde...' : inscrito ? 'Inscrito' : 'Inscrever'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-light mt-16">{inscritosIds.size} aluno(s) inscrito(s) neste exame.</p>
        </Modal>
      )}
    </Layout>
  );
}