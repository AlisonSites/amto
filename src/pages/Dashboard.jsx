import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { formatarData } from '../utils/masks';
import { IconUsers, IconBuilding, IconCalendarCheck, IconRibbon } from '../components/Icons';

export default function Dashboard() {
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'professor';

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState({
    totalAlunos: 0,
    totalAtivos: 0,
    totalUnidades: 0,
    proximosExames: [],
    porUnidade: [],
    porFaixa: [],
  });

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      let queryAlunos = supabase
        .from('alunos')
        .select('id, status, unidade_id, faixa_id, unidades(nome), faixas(nome)');
      if (isProfessor) queryAlunos = queryAlunos.eq('unidade_id', user.unidade_id);

      const [{ data: alunos, error: errAlunos }, { data: unidades, error: errUnidades }, { data: exames, error: errExames }] =
        await Promise.all([
          queryAlunos,
          isProfessor ? Promise.resolve({ data: [] }) : supabase.from('unidades').select('id'),
          supabase.from('exames').select('id, data_exame, descricao, status').order('data_exame', { ascending: true }),
        ]);

      if (errAlunos) throw errAlunos;
      if (errUnidades) throw errUnidades;
      if (errExames) throw errExames;

      const proximos = (exames || []).filter((e) => e.status !== 'concluido').slice(0, 5);

      const contagemUnidade = {};
      const contagemFaixa = {};
      let ativos = 0;

      (alunos || []).forEach((a) => {
        if (a.status === 'ativo') ativos++;
        const nomeUnidade = a.unidades?.nome || 'Sem unidade';
        contagemUnidade[nomeUnidade] = (contagemUnidade[nomeUnidade] || 0) + 1;
        const nomeFaixa = a.faixas?.nome || 'Sem faixa';
        contagemFaixa[nomeFaixa] = (contagemFaixa[nomeFaixa] || 0) + 1;
      });

      setDados({
        totalAlunos: alunos?.length || 0,
        totalAtivos: ativos,
        totalUnidades: unidades?.length || 0,
        proximosExames: proximos,
        porUnidade: Object.entries(contagemUnidade).sort((a, b) => b[1] - a[1]),
        porFaixa: Object.entries(contagemFaixa).sort((a, b) => b[1] - a[1]),
      });
    } catch (e) {
      setErro(e.message || 'Erro ao carregar dados do dashboard.');
    } finally {
      setCarregando(false);
    }
  }

  const maiorValor = Math.max(1, ...dados.porUnidade.map(([, v]) => v), ...dados.porFaixa.map(([, v]) => v));

  return (
    <Layout titulo="Dashboard">
      <div className="page-header">
        <div>
          <h1>Olá, {user?.nome?.split(' ')[0]}</h1>
          <p>{isProfessor ? 'Visão geral da sua unidade.' : 'Visão geral do sistema AMTO.'}</p>
        </div>
      </div>

      {erro && <div className="alert alert-danger mt-16">{erro}</div>}

      {carregando ? (
        <Loader texto="Carregando estatísticas..." />
      ) : (
        <>
          <div className="stats-grid">
            <div className="card card-faixa-top stat-card">
              <div className="stat-icone"><IconUsers /></div>
              <div className="stat-valor">{dados.totalAlunos}</div>
              <div className="stat-label">Alunos cadastrados</div>
            </div>
            <div className="card card-faixa-top stat-card">
              <div className="stat-icone"><IconRibbon /></div>
              <div className="stat-valor">{dados.totalAtivos}</div>
              <div className="stat-label">Alunos ativos</div>
            </div>
            {!isProfessor && (
              <div className="card card-faixa-top stat-card">
                <div className="stat-icone"><IconBuilding /></div>
                <div className="stat-valor">{dados.totalUnidades}</div>
                <div className="stat-label">Unidades</div>
              </div>
            )}
            <div className="card card-faixa-top stat-card">
              <div className="stat-icone"><IconCalendarCheck /></div>
              <div className="stat-valor">{dados.proximosExames.length}</div>
              <div className="stat-label">Próximos exames</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card painel">
              <h3>{isProfessor ? 'Alunos por faixa' : 'Alunos por unidade'}</h3>
              <div className="lista-simples">
                {(isProfessor ? dados.porFaixa : dados.porUnidade).length === 0 && (
                  <p className="text-light">Nenhum dado disponível ainda.</p>
                )}
                {(isProfessor ? dados.porFaixa : dados.porUnidade).map(([nome, valor]) => (
                  <div className="linha" key={nome}>
                    <span>{nome}</span>
                    <div className="barra-progresso">
                      <div
                        className="preenchimento"
                        style={{ width: `${(valor / maiorValor) * 100}%` }}
                      />
                    </div>
                    <strong>{valor}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card painel">
              <h3>Próximos exames</h3>
              <div className="lista-simples">
                {dados.proximosExames.length === 0 && (
                  <p className="text-light">Nenhum exame futuro cadastrado.</p>
                )}
                {dados.proximosExames.map((ex) => (
                  <div className="linha" key={ex.id}>
                    <span>{ex.descricao || 'Exame de graduação'}</span>
                    <strong>{formatarData(ex.data_exame)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}