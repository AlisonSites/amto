import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash, IconRibbon } from '../components/Icons';
import { validarFormulario, formularioValido, required } from '../utils/validators';

const VAZIO = { nome: '', ordem: '' };

export default function Faixas() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    const { data, error } = await supabase.from('faixas').select('*').order('ordem');
    if (error) setErro(error.message);
    else setLista(data || []);
    setCarregando(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm({ nome: '', ordem: String(lista.length + 1) });
    setErros({});
    setModalAberto(true);
  }

  function abrirEdicao(faixa) {
    setEditando(faixa);
    setForm({ nome: faixa.nome, ordem: String(faixa.ordem) });
    setErros({});
    setModalAberto(true);
  }

  function validar() {
    const novosErros = validarFormulario({
      nome: () => required(form.nome, 'Informe o nome da faixa.'),
      ordem: () => (form.ordem === '' || Number.isNaN(Number(form.ordem)) ? 'Informe um número de ordem.' : null),
    });
    setErros(novosErros);
    return formularioValido(novosErros);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setErro('');

    const payload = { nome: form.nome.trim(), ordem: Number(form.ordem) };
    const resultado = editando
      ? await supabase.from('faixas').update(payload).eq('id', editando.id)
      : await supabase.from('faixas').insert(payload);

    setSalvando(false);
    if (resultado.error) {
      setErro(resultado.error.message);
      return;
    }
    setModalAberto(false);
    carregar();
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    const { error } = await supabase.from('faixas').delete().eq('id', excluir.id);
    setExcluindo(false);
    if (error) {
      setErro('Não foi possível excluir: existem alunos ou usuários com esta faixa.');
      setExcluir(null);
      return;
    }
    setExcluir(null);
    carregar();
  }

  return (
    <Layout titulo="Faixas">
      <div className="page-header">
        <div>
          <h1>Faixas</h1>
          <p>Cadastre as graduações utilizadas pela AMTO.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>
          <IconPlus /> Nova faixa
        </button>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="card card-pad">
        {carregando ? (
          <Loader />
        ) : lista.length === 0 ? (
          <div className="estado-vazio">
            <strong>Nenhuma faixa cadastrada</strong>
            Clique em "Nova faixa" para começar.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Ordem</th>
                  <th>Faixa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((f) => (
                  <tr key={f.id}>
                    <td>{f.ordem}</td>
                    <td>
                      <div className="flex gap-8" style={{ alignItems: 'center' }}>
                        <IconRibbon />
                        {f.nome}
                      </div>
                    </td>
                    <td>
                      <div className="tabela-acoes">
                        <button type="button" className="btn btn-outline btn-icon" onClick={() => abrirEdicao(f)}>
                          <IconEdit />
                        </button>
                        <button type="button" className="btn btn-danger btn-icon" onClick={() => setExcluir(f)}>
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

      {modalAberto && (
        <Modal
          titulo={editando ? 'Editar faixa' : 'Nova faixa'}
          tamanho="sm"
          onClose={() => setModalAberto(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="submit" form="form-faixa" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          }
        >
          <form id="form-faixa" onSubmit={salvar} className="form-grid">
            <div className="field span-2">
              <label>Nome da faixa</label>
              <input
                className={erros.nome ? 'invalido' : ''}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Amarela"
              />
              {erros.nome && <span className="erro-msg">{erros.nome}</span>}
            </div>
            <div className="field span-2">
              <label>Ordem de graduação</label>
              <input
                type="number"
                min="1"
                className={erros.ordem ? 'invalido' : ''}
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: e.target.value })}
              />
              {erros.ordem && <span className="erro-msg">{erros.ordem}</span>}
              <span className="ajuda-msg">Define a ordem de exibição, da faixa branca até a preta.</span>
            </div>
          </form>
        </Modal>
      )}

      {excluir && (
        <ConfirmDialog
          mensagem={`Tem certeza que deseja excluir a faixa "${excluir.nome}"?`}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </Layout>
  );
}
