
import { Button } from "./Button";

interface ModalProps {
  show: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function Modal({
  show,
  title,
  onClose,
  onConfirm,
}: ModalProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <Button label="Fechar" variant="secondary" onClick={onClose} />
            </div>

            <div className="modal-body">
              <p>Tem certeza de que deseja excluir este registro?</p>
            </div>

            <div className="modal-footer">
              <Button label="Cancelar" variant="secondary" onClick={onClose} />
              <Button label="Excluir" variant="danger" onClick={onConfirm} />
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show"></div>
    </>
  );
}
