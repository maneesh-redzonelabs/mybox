export default function ConfirmDialog({ title = 'Confirm Delete', message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        <p className="section-subtitle" style={{ margin: '0 0 4px' }}>{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>OK</button>
        </div>
      </div>
    </div>
  );
}
