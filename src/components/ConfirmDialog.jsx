import Modal from './Modal';

export default function ConfirmDialog({ titulo = 'Confirmar ação', mensagem, onConfirm, onCancel, confirmando }) {
  return (
    <Modal
      titulo={titulo}
      tamanho="sm"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={confirmando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={confirmando}>
            {confirmando ? 'Excluindo...' : 'Confirmar exclusão'}
          </button>
        </>
      }
    >
      <p>{mensagem}</p>
    </Modal>
  );
}
