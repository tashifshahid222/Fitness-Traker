import { useState } from 'react';
import Modal from './Modal';

function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel, busy = false }) {
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Request failed');
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="small"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      {error && <div className="alert alert-error">{error}</div>}
    </Modal>
  );
}

export default ConfirmDialog;