import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, uploadFoto } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { maskCPF, onlyDigits } from '../utils/masks';
import { validarFormulario, formularioValido, required, validarCampoCPF, validarSenha } from '../utils/validators';

const VAZIO = {
  nome: '',
  cpf: '',
  faixa_id: '',
  login: '',
  senha: '',
  unidade_id: '',
  perfil: 'professor',
  status: 'ativo',
  foto_url: '',
};

export default function UsuarioForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [unidades, setUnidades] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');

  useEffect(() => {
    carregarApoio();
  }, []);

  async function carregarApoio() {
    setCarregando(true);
    const [{ data: unidadesData }, { data: faixasData }] = await Promise.all([
      supabase.from('unidades').select('id, nome').order('nome'),
      supabase.from('faixas').select('id, nome').order('ordem'),
    ]);
    setUnidades(unidadesData || []);
    setFaixas(faixasData || []);

    if (editando) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, cpf, faixa_id, login, unidade_id, perfil, status, foto_url, created_at')
        .eq('id', id)
        .single();
      if (error) {
        setErroGeral('Usuário não encontrado.');
      } else {
        setForm({ ...VAZIO, ...data, senha: '', faixa_id: data.faixa_id || '', unidade_id: data.unidade_id || '' });
        setPreviewFoto(data.foto_url || '');
      }
    }
    setCarregando(false);
  }

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((er) => ({ ...er, [campo]: undefined }));
  }

  function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setArquivoFoto(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
  }

  function validar() {
    const novosErros = validarFormulario({
      nome: () => required(form.nome, 'Informe o nome completo.'),
      cpf: () => validarCampoCPF(form.cpf),
      login: () => required(form.login, 'Informe um login de acesso.'),
      senha: () => validarSenha(form.senha, { obrigatorio: !editando }),
      unidade_id: () => (form.perfil === 'professor' ? required(form.unidade_id, 'Selecione a unidade do professor.') : null),
    });
    setErros(novosErros);
    return formularioValido(novosErros);
  }

  async function salvar(e) {
    e.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setSalvando(true);
    try {
      let foto_url = form.foto_url || null;
      if (arquivoFoto) {
        foto_url = await uploadFoto(arquivoFoto, 'usuarios');
      }

      const payload = {
        nome: form.nome.trim(),
        cpf: onlyDigits(form.cpf),
        faixa_id: form.faixa_id || null,
        login: form.login.trim(),
        unidade_id: form.perfil === 'professor' ? form.unidade_id : null,
        perfil: form.perfil,
        status: form.status,
        foto_url,
      };
      if (form.senha) payload.senha = form.senha;

      const resultado = editando
        ? await supabase.from('usuarios').update(payload).eq('id', id)
        : await supabase.from('usuarios').insert(payload);

      if (resultado.error) throw resultado.error;
      navigate('/usuarios');
    } catch (err) {
      if (err.code === '23505') {
        setErroGeral('Já existe um usuário com este CPF ou login.');
      } else {
        setErroGeral(err.message || 'Erro ao salvar usuário.');
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout titulo="Usuários">
        <Loader />
      </Layout>
    );
  }

  return (
    <Layout titulo="Usuários">
      <div className="page-header">
        <div>
          <h1>{editando ? 'Editar usuário' : 'Novo usuário'}</h1>
          <p>Cadastre professores e administradores com acesso ao sistema.</p>
        </div>
      </div>

      {erroGeral && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erroGeral}</div>}

      <form className="card card-pad" onSubmit={salvar}>
        <div className="upload-foto" style={{ marginBottom: 22 }}>
          <div className="preview">
            {previewFoto ? <img src={previewFoto} alt="Foto do usuário" /> : 'Sem foto'}
          </div>
          <div className="field">
            <label>Imagem <span className="opcional">(opcional)</span></label>
            <input type="file" accept="image/*" onChange={handleFoto} />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Nome completo</label>
            <input
              className={erros.nome ? 'invalido' : ''}
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
            />
            {erros.nome && <span className="erro-msg">{erros.nome}</span>}
          </div>

          <div className="field">
            <label>CPF</label>
            <input
              className={erros.cpf ? 'invalido' : ''}
              value={maskCPF(form.cpf)}
              onChange={(e) => atualizarCampo('cpf', e.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            {erros.cpf && <span className="erro-msg">{erros.cpf}</span>}
          </div>

          <div className="field">
            <label>Faixa <span className="opcional">(opcional)</span></label>
            <select value={form.faixa_id} onChange={(e) => atualizarCampo('faixa_id', e.target.value)}>
              <option value="">Selecione...</option>
              {faixas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Perfil</label>
            <select value={form.perfil} onChange={(e) => atualizarCampo('perfil', e.target.value)}>
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="field">
            <label>Login</label>
            <input
              className={erros.login ? 'invalido' : ''}
              value={form.login}
              onChange={(e) => atualizarCampo('login', e.target.value)}
              placeholder="Login de acesso"
              autoComplete="off"
            />
            {erros.login && <span className="erro-msg">{erros.login}</span>}
          </div>

          <div className="field">
            <label>Senha {editando && <span className="opcional">(deixe em branco para manter)</span>}</label>
            <input
              type="password"
              className={erros.senha ? 'invalido' : ''}
              value={form.senha}
              onChange={(e) => atualizarCampo('senha', e.target.value)}
              autoComplete="new-password"
            />
            {erros.senha && <span className="erro-msg">{erros.senha}</span>}
          </div>

          {form.perfil === 'professor' && (
            <div className="field">
              <label>Unidade</label>
              <select
                className={erros.unidade_id ? 'invalido' : ''}
                value={form.unidade_id}
                onChange={(e) => atualizarCampo('unidade_id', e.target.value)}
              >
                <option value="">Selecione...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
              {erros.unidade_id && <span className="erro-msg">{erros.unidade_id}</span>}
            </div>
          )}

          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/usuarios')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar usuário'}
          </button>
        </div>
      </form>
    </Layout>
  );
}