import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, uploadFoto } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import {
  maskCPF,
  maskRG,
  maskPhone,
  onlyDigits,
  calcularIdade,
  isMenorDeIdade,
  dataHojeISO,
} from '../utils/masks';
import { validarFormulario, formularioValido, required, validarCampoCPF } from '../utils/validators';

const VAZIO = {
  foto_url: '',
  nome_completo: '',
  data_nascimento: '',
  cpf: '',
  rg: '',
  data_inicio: dataHojeISO(),
  unidade_id: '',
  faixa_id: '',
  responsavel_financeiro: false,
  nome_pai: '',
  nome_mae: '',
  primeiro_contato: '',
  segundo_contato: '',
  status: 'ativo',
};

export default function AlunoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'professor';

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
        .from('alunos')
        .select(
          'id, foto_url, nome_completo, data_nascimento, cpf, rg, nome_pai, nome_mae, primeiro_contato, segundo_contato, data_inicio, responsavel_financeiro, unidade_id, faixa_id, login, status, created_at'
        )
        .eq('id', id)
        .single();
      if (error) {
        setErroGeral('Aluno não encontrado.');
      } else {
        setForm({
          ...VAZIO,
          ...data,
          rg: data.rg || '',
          faixa_id: data.faixa_id || '',
        });
        setPreviewFoto(data.foto_url || '');
      }
    } else if (isProfessor) {
      setForm((f) => ({ ...f, unidade_id: user.unidade_id }));
    }
    setCarregando(false);
  }

  const idade = calcularIdade(form.data_nascimento);
  const menorDeIdade = isMenorDeIdade(form.data_nascimento);

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((er) => ({ ...er, [campo]: undefined }));
  }

  function handleDataNascimento(valor) {
    const novoFormulario = { ...form, data_nascimento: valor };
    if (isMenorDeIdade(valor)) novoFormulario.responsavel_financeiro = false;
    setForm(novoFormulario);
  }

  function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setArquivoFoto(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
  }

  function validar() {
    const novosErros = validarFormulario({
      nome_completo: () => required(form.nome_completo, 'Informe o nome completo.'),
      data_nascimento: () => required(form.data_nascimento, 'Informe a data de nascimento.'),
      cpf: () => validarCampoCPF(form.cpf),
      data_inicio: () => required(form.data_inicio, 'Informe a data de início.'),
      unidade_id: () => required(form.unidade_id, 'Selecione a unidade.'),
      primeiro_contato: () => {
        const digitos = onlyDigits(form.primeiro_contato);
        if (!digitos) return 'Informe o primeiro contato.';
        if (digitos.length < 10) return 'Telefone incompleto.';
        return null;
      },
      segundo_contato: () => {
        if (!form.segundo_contato) return null;
        const digitos = onlyDigits(form.segundo_contato);
        if (digitos.length < 10) return 'Telefone incompleto.';
        return null;
      },
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
        foto_url = await uploadFoto(arquivoFoto, 'alunos');
      }

      const cpfDigitos = onlyDigits(form.cpf);

      const payload = {
        foto_url,
        nome_completo: form.nome_completo.trim(),
        data_nascimento: form.data_nascimento,
        cpf: cpfDigitos,
        rg: onlyDigits(form.rg) || null,
        data_inicio: form.data_inicio,
        unidade_id: isProfessor ? user.unidade_id : form.unidade_id,
        faixa_id: form.faixa_id || null,
        responsavel_financeiro: Boolean(form.responsavel_financeiro),
        nome_pai: form.responsavel_financeiro ? null : form.nome_pai?.trim() || null,
        nome_mae: form.responsavel_financeiro ? null : form.nome_mae?.trim() || null,
        primeiro_contato: onlyDigits(form.primeiro_contato),
        segundo_contato: onlyDigits(form.segundo_contato) || null,
        status: form.status,
      };

      let resultado;
      if (editando) {
        resultado = await supabase.from('alunos').update(payload).eq('id', id);
      } else {
        // Acesso padrão do aluno ao sistema: login = CPF, senha inicial = CPF.
        resultado = await supabase
          .from('alunos')
          .insert({ ...payload, login: cpfDigitos, senha: cpfDigitos });
      }

      if (resultado.error) throw resultado.error;
      navigate('/alunos');
    } catch (err) {
      if (err.code === '23505') {
        setErroGeral('Já existe um aluno cadastrado com este CPF.');
      } else {
        setErroGeral(err.message || 'Erro ao salvar aluno.');
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout titulo="Alunos">
        <Loader />
      </Layout>
    );
  }

  return (
    <Layout titulo="Alunos">
      <div className="page-header">
        <div>
          <h1>{editando ? 'Editar aluno' : 'Novo aluno'}</h1>
          <p>Preencha os dados de cadastro do aluno.</p>
        </div>
      </div>

      {erroGeral && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erroGeral}</div>}

      <form className="card card-pad" onSubmit={salvar}>
        <div className="upload-foto" style={{ marginBottom: 22 }}>
          <div className="preview">
            {previewFoto ? <img src={previewFoto} alt="Foto do aluno" /> : 'Sem foto'}
          </div>
          <div className="field">
            <label>Foto do aluno <span className="opcional">(opcional)</span></label>
            <input type="file" accept="image/*" onChange={handleFoto} />
          </div>
        </div>

        <div className="form-grid">
          <div className="field span-2">
            <label>Nome completo</label>
            <input
              className={erros.nome_completo ? 'invalido' : ''}
              value={form.nome_completo}
              onChange={(e) => atualizarCampo('nome_completo', e.target.value)}
              placeholder="Nome completo do aluno"
            />
            {erros.nome_completo && <span className="erro-msg">{erros.nome_completo}</span>}
          </div>

          <div className="field">
            <label>Data de nascimento</label>
            <input
              type="date"
              className={erros.data_nascimento ? 'invalido' : ''}
              value={form.data_nascimento}
              onChange={(e) => handleDataNascimento(e.target.value)}
              max={dataHojeISO()}
            />
            {erros.data_nascimento && <span className="erro-msg">{erros.data_nascimento}</span>}
            {idade !== null && <span className="ajuda-msg">Idade: {idade} anos {menorDeIdade ? '(menor de idade)' : ''}</span>}
          </div>

          <div className="field">
            <label>Data de início</label>
            <input
              type="date"
              className={erros.data_inicio ? 'invalido' : ''}
              value={form.data_inicio}
              onChange={(e) => atualizarCampo('data_inicio', e.target.value)}
            />
            {erros.data_inicio && <span className="erro-msg">{erros.data_inicio}</span>}
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
            <label>RG <span className="opcional">(opcional)</span></label>
            <input
              value={maskRG(form.rg)}
              onChange={(e) => atualizarCampo('rg', e.target.value)}
              placeholder="00.000.000-0"
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <label>Unidade</label>
            <select
              className={erros.unidade_id ? 'invalido' : ''}
              value={isProfessor ? user.unidade_id : form.unidade_id}
              onChange={(e) => atualizarCampo('unidade_id', e.target.value)}
              disabled={isProfessor}
            >
              <option value="">Selecione...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            {erros.unidade_id && <span className="erro-msg">{erros.unidade_id}</span>}
          </div>

          <div className="field">
            <label>Faixa atual <span className="opcional">(opcional)</span></label>
            <select value={form.faixa_id} onChange={(e) => atualizarCampo('faixa_id', e.target.value)}>
              <option value="">Selecione...</option>
              {faixas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          {editando && (
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          )}

          <div className="field span-2">
            <label>O aluno é o próprio responsável financeiro?</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="responsavel"
                  checked={form.responsavel_financeiro === true}
                  disabled={menorDeIdade}
                  onChange={() => atualizarCampo('responsavel_financeiro', true)}
                />
                Sim
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="responsavel"
                  checked={form.responsavel_financeiro === false}
                  onChange={() => atualizarCampo('responsavel_financeiro', false)}
                />
                Não
              </label>
            </div>
            {menorDeIdade && (
              <span className="ajuda-msg">
                Alunos menores de idade não podem ser marcados como o próprio responsável financeiro.
              </span>
            )}
          </div>

          {!form.responsavel_financeiro && (
            <>
              <div className="fieldset-titulo span-2">Dados dos responsáveis</div>
              <div className="field">
                <label>Nome do pai <span className="opcional">(opcional)</span></label>
                <input value={form.nome_pai} onChange={(e) => atualizarCampo('nome_pai', e.target.value)} />
              </div>
              <div className="field">
                <label>Nome da mãe <span className="opcional">(opcional)</span></label>
                <input value={form.nome_mae} onChange={(e) => atualizarCampo('nome_mae', e.target.value)} />
              </div>
            </>
          )}

          <div className="fieldset-titulo span-2">Contato</div>

          <div className="field">
            <label>{form.responsavel_financeiro ? 'Primeiro contato (telefone)' : 'Primeiro contato do responsável'}</label>
            <input
              className={erros.primeiro_contato ? 'invalido' : ''}
              value={maskPhone(form.primeiro_contato)}
              onChange={(e) => atualizarCampo('primeiro_contato', e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="numeric"
            />
            {erros.primeiro_contato && <span className="erro-msg">{erros.primeiro_contato}</span>}
          </div>

          <div className="field">
            <label>Segundo contato <span className="opcional">(opcional)</span></label>
            <input
              className={erros.segundo_contato ? 'invalido' : ''}
              value={maskPhone(form.segundo_contato)}
              onChange={(e) => atualizarCampo('segundo_contato', e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="numeric"
            />
            {erros.segundo_contato && <span className="erro-msg">{erros.segundo_contato}</span>}
          </div>
        </div>

        {!editando && (
          <div className="alert alert-info mt-16">
            Acesso do aluno ao sistema: login = CPF (somente números) e senha inicial = CPF. Recomende a troca em um próximo acesso.
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/alunos')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar aluno'}
          </button>
        </div>
      </form>
    </Layout>
  );
}