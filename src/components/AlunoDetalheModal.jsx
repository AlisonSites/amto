import Modal from './Modal';
import { maskCPF, maskRG, maskPhone, formatarData } from '../utils/masks';

export default function AlunoDetalheModal({ aluno, onClose }) {
  if (!aluno) return null;

  const iniciais = aluno.nome_completo
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <Modal titulo="Dados do aluno" onClose={onClose}>
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
    </Modal>
  );
}
