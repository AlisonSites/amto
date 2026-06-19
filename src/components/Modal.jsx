import { useEffect } from 'react';
import { IconClose } from './Icons';

export default function Modal({ titulo, onClose, children, footer, tamanho }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal-box ${tamanho === 'sm' ? 'modal-sm' : ''} ${tamanho === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}