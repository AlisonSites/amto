import { useEffect, useState } from 'react';
import { supabase, uploadFoto } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { maskCPF, onlyDigits } from '../utils/masks';
import { validarFormulario, formularioValido, required, validarCampoCPF, validarSenha } from '../utils/validators';

export default function Perfil() {
  const { user, atualizarUsuario } = useAuth();
  const isProfessor = user?.tipo === 'professor';

  const [form, setForm] = useState({ nome: '', cpf: '', faixa_id: '', login: '', senha: '' });
  const [erros, setErros] = useState({});
  const [faixas, setFaixas] = useState([]);
  const [unidadeNome, setUnidadeNome] = useState('');
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const [{ data: faixasData }, { data: usuarioData }] = await Promise.all([
      supabase.from('faixas').select('id, nome').order('ordem'),
      supabase
        .from('usuarios')
        .select('id, nome, cpf, faixa_id, login, unidade_id, perfil, status, foto_url, created_at, unidades(nome)')
        .eq('id', user.id)
        .single(),
    ]);
    setFaixas(faixasData || []);
    if (usuarioData) {
      setForm({
        nome: usuarioData.nome,
        cpf: usuarioData.cpf,
        faixa_id: usuarioData.faixa_id || '',
        login: usuarioData.login,
        senha: '',
      });
      setPreviewFoto(usuarioData.foto_url || '');
      setUnidadeNome(usuarioData.unidades?.nome || '');
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
      senha: () => validarSenha(form.senha, { obrigatorio: false }),
    });
    setErros(novosErros);
    return formularioValido(novosErros);
  }

  async function salvar(e) {
    e.preventDefault();
    setErroGeral('');
    setSucesso('');
    if (!validar()) return;

    setSalvando(true);
    try {
      let foto_url = previewFoto || null;
      if (arquivoFoto) {
        foto_url = await uploadFoto(arquivoFoto, 'usuarios');
      }

      const payload = {
        nome: form.nome.trim(),
        cpf: onlyDigits(form.cpf),
        faixa_id: form.faixa_id || null,
        login: form.login.trim(),
        foto_url,
      };
      if (form.senha) payload.senha = form.senha;

      const { error } = await supabase.from('usuarios').update(payload).eq('id', user.id);
      if (error) throw error;

      atualizarUsuario({ nome: payload.nome, login: payload.login, foto_url, cpf: payload.cpf });
      setForm((f) => ({ ...f, senha: '' }));
      setSucesso('Perfil atualizado com sucesso.');
    } catch (err) {
      if (err.code === '23505') {
        setErroGeral('Já existe um usuário com este CPF ou login.');
      } else {
        setErroGeral(err.message || 'Erro ao salvar perfil.');
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout titulo="Perfil">
        <Loader />
      </Layout>
    );
  }

  return (
    <Layout titulo="Perfil">
      <div className="page-header">
        <div>
          <h1>Meu perfil</h1>
          <p>Atualize seus dados de acesso ao sistema.</p>
        </div>
      </div>

      {erroGeral && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erroGeral}</div>}
      {sucesso && <div className="alert alert-success mt-16" style={{ marginBottom: 16 }}>{sucesso}</div>}

      <form className="card card-pad" onSubmit={salvar}>
        <div className="upload-foto" style={{ marginBottom: 22 }}>
          <div className="preview">
            {previewFoto ? <img src={previewFoto} alt={form.nome} /> : 'Sem foto'}
          </div>
          <div className="field">
            <label>Foto <span className="opcional">(opcional)</span></label>
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
              inputMode="numeric"
            />
            {erros.cpf && <span className="erro-msg">{erros.cpf}</span>}
          </div>

          <div className="field">
            <label>Faixa <span className="opcional">{isProfessor ? '(somente o administrador pode alterar)' : '(opcional)'}</span></label>
            <select
              value={form.faixa_id}
              onChange={(e) => atualizarCampo('faixa_id', e.target.value)}
              disabled={isProfessor}
            >
              <option value="">Selecione...</option>
              {faixas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            {isProfessor && <span className="ajuda-msg">A faixa só pode ser alterada por um administrador.</span>}
          </div>

          {isProfessor && (
            <div className="field">
              <label>Unidade</label>
              <input value={unidadeNome} disabled />
              <span className="ajuda-msg">A unidade só pode ser alterada por um administrador.</span>
            </div>
          )}

          <div className="field">
            <label>Login</label>
            <input
              className={erros.login ? 'invalido' : ''}
              value={form.login}
              onChange={(e) => atualizarCampo('login', e.target.value)}
              autoComplete="off"
            />
            {erros.login && <span className="erro-msg">{erros.login}</span>}
          </div>

          <div className="field">
            <label>Nova senha <span className="opcional">(deixe em branco para manter)</span></label>
            <input
              type="password"
              className={erros.senha ? 'invalido' : ''}
              value={form.senha}
              onChange={(e) => atualizarCampo('senha', e.target.value)}
              autoComplete="new-password"
            />
            {erros.senha && <span className="erro-msg">{erros.senha}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Layout>
  );
}