import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { IconCalendarCheck } from '../components/Icons';
import { formatarData } from '../utils/masks';

export default function AlunoExames() {
  const { user } = useAuth();
  const [inscricoes, setInscricoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    const { data, error } = await supabase
      .from('exame_inscricoes')
      .select('id, exames(id, data_exame, descricao, status), faixas(nome)')
      .eq('aluno_id', user.id)
      .order('id', { ascending: false });

    if (error) setErro(error.message);
    else setInscricoes(data || []);
    setCarregando(false);
  }

  return (
    <Layout titulo="Meus Exames">
      <div className="page-header">
        <div>
          <h1>Meus exames</h1>
          <p>Acompanhe as datas de exame em que você está inscrito.</p>
        </div>
      </div>

      {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="card card-pad">
        {carregando ? (
          <Loader />
        ) : inscricoes.length === 0 ? (
          <div className="estado-vazio">
            <strong>Você ainda não está inscrito em nenhum exame</strong>
            Fale com o seu professor para se inscrever na próxima data de exame.
          </div>
        ) : (
          <div className="lista-simples">
            {inscricoes.map((insc) => {
              const concluido = insc.exames?.status === 'concluido';
              return (
                <div className="linha" key={insc.id}>
                  <span className="flex gap-8" style={{ alignItems: 'center' }}>
                    <IconCalendarCheck />
                    <span>
                      <strong>{formatarData(insc.exames?.data_exame)}</strong>
                      {insc.exames?.descricao && <span className="text-light"> · {insc.exames.descricao}</span>}
                      <br />
                      <span className="text-light">Faixa na inscrição: {insc.faixas?.nome || '-'}</span>
                    </span>
                  </span>
                  <span className={`badge ${concluido ? 'badge-success' : 'badge-primary'}`}>
                    {concluido ? 'Concluído' : 'Agendado'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}