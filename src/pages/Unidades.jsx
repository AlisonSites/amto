import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash, IconBuilding } from '../components/Icons';
import { validarFormulario, formularioValido, required } from '../utils/validators';

const VAZIO = { nome: '', cidade: '' };

export default function Unidades() {
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
    const { data, error } = await supabase.from('unidades').select('*').order('nome');
    if (error) setErro(error.message);
    else setLista(data || []);
    setCarregando(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm(VAZIO);
    setErros({});
    setModalAberto(true);
  }

  function abrirEdicao(unidade) {
    setEditando(unidade);
    setForm({ nome: unidade.nome, cidade: unidade.cidade });
    setErros({});
    setModalAberto(true);
  }

  function validar() {
    const novosErros = validarFormulario({
      nome: () => required(form.nome, 'Informe o nome da unidade.'),
      cidade: () => required(form.cidade, 'Informe a cidade.'),
    });
    setErros(novosErros);
    return formularioValido(novosErros);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setErro('');

    const payload = { nome: form.nome.trim(), cidade: form.cidade.trim() };
    const resultado = editando
      ? await supabase.from('unidades').update(payload).eq('id', editando.id)
      : await supabase.from('unidades').insert(payload);

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
    const { error } = await supabase.from('unidades').delete().eq('id', excluir.id);
    setExcluindo(false);
    if (error) {
      setErro('Não foi possível excluir: verifique se existem alunos ou usuários vinculados a esta unidade.');
      setExcluir(null);
      return;
    }
    setExcluir(null);
    carregar();
  }

  return (
    <Layout titulo="Unidades">
      <div className="page-header">
        <div>
          <h1>Unidades</h1>
          <p>Gerencie as unidades de treinamento da AMTO.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>
          <IconPlus /> Nova unidade
        </button>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="card card-pad">
        {carregando ? (
          <Loader />
        ) : lista.length === 0 ? (
          <div className="estado-vazio">
            <strong>Nenhuma unidade cadastrada</strong>
            Clique em "Nova unidade" para começar.
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Cidade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex gap-8" style={{ alignItems: 'center' }}>
                        <IconBuilding />
                        {u.nome}
                      </div>
                    </td>
                    <td>{u.cidade}</td>
                    <td>
                      <div className="tabela-acoes">
                        <button type="button" className="btn btn-outline btn-icon" onClick={() => abrirEdicao(u)}>
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

      {modalAberto && (
        <Modal
          titulo={editando ? 'Editar unidade' : 'Nova unidade'}
          tamanho="sm"
          onClose={() => setModalAberto(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="submit" form="form-unidade" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          }
        >
          <form id="form-unidade" onSubmit={salvar} className="form-grid">
            <div className="field span-2">
              <label>Nome da unidade</label>
              <input
                className={erros.nome ? 'invalido' : ''}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Unidade Centro"
              />
              {erros.nome && <span className="erro-msg">{erros.nome}</span>}
            </div>
            <div className="field span-2">
              <label>Cidade</label>
              <input
                className={erros.cidade ? 'invalido' : ''}
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Ex: Macau"
              />
              {erros.cidade && <span className="erro-msg">{erros.cidade}</span>}
            </div>
          </form>
        </Modal>
      )}

      {excluir && (
        <ConfirmDialog
          mensagem={`Tem certeza que deseja excluir a unidade "${excluir.nome}"? Esta ação não pode ser desfeita.`}
          onCancel={() => setExcluir(null)}
          onConfirm={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </Layout>
  );
}
