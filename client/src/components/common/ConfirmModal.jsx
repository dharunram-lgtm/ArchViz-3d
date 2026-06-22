import Modal from './Modal'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Delete', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-surface-600 dark:text-dark-200 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} className={danger ? 'btn-danger' : 'btn-primary'}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
