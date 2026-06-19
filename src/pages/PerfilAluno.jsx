import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { maskCPF, maskRG, maskPhone, formatarData } from '../utils/masks';

export default function PerfilAluno() {
  const { user } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    const { data, error } = await supabase
      .from('alunos')
      .select(
        'id, foto_url, nome_completo, data_nascimento, cpf, rg, nome_pai, nome_mae, primeiro_contato, segundo_contato, data_inicio, responsavel_financeiro, unidade_id, faixa_id, login, status, created_at, unidades(nome), faixas(nome)'
      )
      .eq('id', user.id)
      .single();
    if (error) setErro(error.message);
    else setAluno(data);
    setCarregando(false);
  }

  if (carregando) {
    return (
      <Layout titulo="Meu perfil">
        <Loader />
      </Layout>
    );
  }

  const iniciais = (aluno?.nome_completo || '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <Layout titulo="Meu perfil">
      <div className="page-header">
        <div>
          <h1>Meu perfil</h1>
          <p>Seus dados de cadastro na AMTO. Para alterações, fale com a sua unidade.</p>
        </div>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      {aluno && (
        <div className="card card-pad">
          <div className="detalhe-aluno-cabecalho">
            {aluno.foto_url ? (
              <img src={aluno.foto_url} alt={aluno.nome_completo} />
            ) : (
              <div className="sem-foto">{iniciais}</div>
            )}
            <div>
              <h3 style={{ marginBottom: 4 }}>{aluno.nome_completo}</h3>
              <span className="badge badge-primary">{aluno.faixas?.nome || 'Sem faixa'}</span>
            </div>
          </div>

          <div className="detalhe-grid">
            <div>
              <div className="item-label">CPF</div>
              <div className="item-valor">{maskCPF(aluno.cpf)}</div>
            </div>
            <div>
              <div className="item-label">RG</div>
              <div className="item-valor">{aluno.rg ? maskRG(aluno.rg) : '-'}</div>
            </div>
            <div>
              <div className="item-label">Data de nascimento</div>
              <div className="item-valor">{formatarData(aluno.data_nascimento)}</div>
            </div>
            <div>
              <div className="item-label">Data de início</div>
              <div className="item-valor">{formatarData(aluno.data_inicio)}</div>
            </div>
            <div>
              <div className="item-label">Unidade</div>
              <div className="item-valor">{aluno.unidades?.nome || '-'}</div>
            </div>
            <div>
              <div className="item-label">Status</div>
              <div className="item-valor">{aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}</div>
            </div>
            <div>
              <div className="item-label">Responsável financeiro</div>
              <div className="item-valor">{aluno.responsavel_financeiro ? 'O próprio aluno' : 'Responsável legal'}</div>
            </div>
            <div>
              <div className="item-label">Primeiro contato</div>
              <div className="item-valor">{aluno.primeiro_contato ? maskPhone(aluno.primeiro_contato) : '-'}</div>
            </div>
            <div>
              <div className="item-label">Segundo contato</div>
              <div className="item-valor">{aluno.segundo_contato ? maskPhone(aluno.segundo_contato) : '-'}</div>
            </div>
            {!aluno.responsavel_financeiro && (
              <>
                <div>
                  <div className="item-label">Nome do pai</div>
                  <div className="item-valor">{aluno.nome_pai || '-'}</div>
                </div>
                <div>
                  <div className="item-label">Nome da mãe</div>
                  <div className="item-valor">{aluno.nome_mae || '-'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}