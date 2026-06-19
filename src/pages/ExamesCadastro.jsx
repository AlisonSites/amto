import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlunoDetalheModal from '../components/AlunoDetalheModal';
import { IconPlus, IconTrash, IconCalendarCheck, IconCheck } from '../components/Icons';
import { maskCPF, formatarData, dataHojeISO } from '../utils/masks';
import { validarFormulario, formularioValido, required } from '../utils/validators';

const VAZIO = { data_exame: '', descricao: '' };

export default function ExamesCadastro() {
  const [exames, setExames] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [atualizandoStatusId, setAtualizandoStatusId] = useState(null);

  const [exameSelecionado, setExameSelecionado] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [carregandoInscritos, setCarregandoInscritos] = useState(false);
  const [alunoDetalhe, setAlunoDetalhe] = useState(null);
  const [filtroUnidade, setFiltroUnidade] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    const [{ data, error }, { data: unidadesData }] = await Promise.all([
      supabase.from('exames').select('*').order('data_exame', { ascending: false }),
      supabase.from('unidades').select('id, nome').order('nome'),
    ]);
    if (error) setErro(error.message);
    else setExames(data || []);
    setUnidades(unidadesData || []);
    setCarregando(false);
  }

  function abrirNovo() {
    setForm({ data_exame: dataHojeISO(), descricao: '' });
    setErros({});
    setModalAberto(true);
  }

  function validar() {
    const novosErros = validarFormulario({
      data_exame: () => required(form.data_exame, 'Informe a data do exame.'),
    });
    setErros(novosErros);
    return formularioValido(novosErros);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setErro('');
    const { error } = await supabase
      .from('exames')
      .insert({ data_exame: form.data_exame, descricao: form.descricao.trim() || null });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setModalAberto(false);
    carregar();
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    const { error } = await supabase.from('exames').delete().eq('id', excluir.id);
    setExcluindo(false);
    if (error) {
      setErro('Não foi possível excluir este exame.');
      setExcluir(null);
      return;
    }
    if (exameSelecionado?.id === excluir.id) setExameSelecionado(null);
    setExcluir(null);
    carregar();
  }

  async function alternarStatusExame(ex) {
    const novoStatus = ex.status === 'concluido' ? 'agendado' : 'concluido';
    setAtualizandoStatusId(ex.id);
    setErro('');
    const { error } = await supabase.from('exames').update({ status: novoStatus }).eq('id', ex.id);
    setAtualizandoStatusId(null);
    if (error) {
      setErro('Não foi possível atualizar o status do exame.');
      return;
    }
    setExames((lista) => lista.map((e) => (e.id === ex.id ? { ...e, status: novoStatus } : e)));
    if (exameSelecionado?.id === ex.id) {
      setExameSelecionado((s) => ({ ...s, status: novoStatus }));
    }
  }

  async function verInscritos(exame) {
    setExameSelecionado(exame);
    setFiltroUnidade('');
    setCarregandoInscritos(true);
    const { data, error } = await supabase
      .from('exame_inscricoes')
      .select(
        'id, aluno_id, alunos(id, nome_completo, cpf, rg, data_nascimento, data_inicio, foto_url, status, responsavel_financeiro, nome_pai, nome_mae, primeiro_contato, segundo_contato, unidade_id, unidades(nome), faixas(nome))'
      )
      .eq('exame_id', exame.id);

    if (!error) setInscritos(data || []);
    setCarregandoInscritos(false);
  }

  const inscritosFiltrados = useMemo(() => {
    if (!filtroUnidade) return inscritos;
    return inscritos.filter((i) => i.alunos?.unidade_id === filtroUnidade);
  }, [inscritos, filtroUnidade]);

  const gruposPorUnidade = useMemo(() => {
    const grupos = {};
    inscritosFiltrados.forEach((insc) => {
      const nomeUnidade = insc.alunos?.unidades?.nome || 'Sem unidade';
      if (!grupos[nomeUnidade]) grupos[nomeUnidade] = [];
      grupos[nomeUnidade].push(insc);
    });
    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
  }, [inscritosFiltrados]);

  function renderTabelaInscritos(lista) {
    return (
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>CPF</th>
              <th>Nome</th>
              <th>Faixa</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((insc) => (
              <tr key={insc.id} className="clicavel" onClick={() => setAlunoDetalhe(insc.alunos)}>
                <td>{maskCPF(insc.alunos.cpf)}</td>
                <td>{insc.alunos.nome_completo}</td>
                <td>{insc.alunos.faixas?.nome || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Layout titulo="Cadastrar Exames">
      <div className="page-header">
        <div>
          <h1>Cadastrar Exames</h1>
          <p>Crie datas de exame, marque como concluído e acompanhe os alunos inscritos em cada uma.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>
          <IconPlus /> Nova data de exame
        </button>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="dashboard-grid">
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Datas cadastradas</h3>
          {carregando ? (
            <Loader />
          ) : exames.length === 0 ? (
            <div className="estado-vazio">
              <strong>Nenhum exame cadastrado</strong>
              Cadastre a primeira data de exame.
            </div>
          ) : (
            <div className="lista-simples">
              {exames.map((ex) => (
                <div
                  key={ex.id}
                  className="linha"
                  style={{
                    cursor: 'pointer',
                    background: exameSelecionado?.id === ex.id ? 'rgba(16,108,204,0.06)' : 'transparent',
                    borderRadius: 8,
                    padding: '10px 8px',
                  }}
                  onClick={() => verInscritos(ex)}
                >
                  <span className="flex gap-8" style={{ alignItems: 'center' }}>
                    <IconCalendarCheck />
                    <span>
                      <strong>{formatarData(ex.data_exame)}</strong>
                      {ex.descricao && <span className="text-light"> · {ex.descricao}</span>}
                    </span>
                  </span>

                  <span className="flex gap-8" style={{ alignItems: 'center' }}>
                    <span className={`badge ${ex.status === 'concluido' ? 'badge-success' : 'badge-primary'}`}>
                      {ex.status === 'concluido' ? <IconCheck /> : null}
                      {ex.status === 'concluido' ? 'Concluído' : 'Agendado'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={atualizandoStatusId === ex.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarStatusExame(ex);
                      }}
                    >
                      {atualizandoStatusId === ex.id ? 'Aguarde...' : ex.status === 'concluido' ? 'Reabrir' : 'Concluir'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExcluir(ex);
                      }}
                    >
                      <IconTrash />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="flex-between mt-16" style={{ marginBottom: 16, marginTop: 0, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0 }}>
              {exameSelecionado ? `Inscritos em ${formatarData(exameSelecionado.data_exame)}` : 'Selecione um exame'}
            </h3>
            {exameSelecionado && (
              <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)}>
                <option value="">Todas as unidades</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            )}
          </div>

          {!exameSelecionado ? (
            <p className="text-light">Clique em uma data de exame para ver os alunos inscritos.</p>
          ) : carregandoInscritos ? (
            <Loader />
          ) : inscritosFiltrados.length === 0 ? (
            <p className="text-light">Nenhum aluno inscrito com esse filtro.</p>
          ) : filtroUnidade ? (
            renderTabelaInscritos(inscritosFiltrados)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {gruposPorUnidade.map(([nomeUnidade, lista]) => (
                <div key={nomeUnidade}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <strong style={{ color: 'var(--color-primary-dark)', fontFamily: 'var(--font-display)' }}>
                      {nomeUnidade}
                    </strong>
                    <span className="badge badge-neutral">{lista.length} inscrito(s)</span>
                  </div>
                  {renderTabelaInscritos(lista)}
                </div>
              ))}
            </div>
          )}

          {exameSelecionado && inscritosFiltrados.length > 0 && (
            <p className="text-light mt-16">Total: {inscritosFiltrados.length} aluno(s) inscrito(s).</p>
          )}
        </div>
      </div>

      {modalAberto && (
        <Modal
          titulo="Nova data de exame"
          tamanho="sm"
          onClose={() => setModalAberto(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="submit" form="form-exame" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          }
        >
          <form id="form-exame" onSubmit={salvar} className="form-grid">
            <div className="field span-2">
              <label>Data do exame</label>
              <input
                type="date"
                className={erros.data_exame ? 'invalido' : ''}
                value={form.data_exame}
                onChange={(e) => setForm({ ...form, data_exame: e.target.value })}
              />
              {erros.data_exame && <span className="erro-msg">{erros.data_exame}</span>}
            </div>
            <div className="field span-2">
              <label>Descrição <span className="opcional">(opcional)</span></label>
              <input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Exame de graduação - 1º semestre"
              />
            </div>
          </form>
        </Modal>
      )}

      {alunoDetalhe && <AlunoDetalheModal aluno={alunoDetalhe} onClose={() => setAlunoDetalhe(null)} />}

      {excluir && (
        <ConfirmDialog
          mensagem={`Tem certeza que deseja excluir o exame de ${formatarData(excluir.data_exame)}? Todas as inscrições vinculadas também serão removidas.`}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </Layout>
  );
}