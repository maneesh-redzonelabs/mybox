import { useState } from 'react';
import { api } from '../api/client';
import { isValidEmail } from '../lib/validators';
import DateField from './DateField.jsx';

export default function UpdateProfileModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [dob, setDob] = useState(user.dateOfBirth || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !isValidEmail(trimmedEmail)) {
      setError('Please enter a valid name and email.');
      return;
    }
    setBusy(true);
    try {
      const updated = await api.updateProfile({ name: trimmedName, email: trimmedEmail, dateOfBirth: dob || null });
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Update Profile</h3>
        <div className="field">
          <label htmlFor="up-name">Full Name</label>
          <input type="text" id="up-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="up-email">Email Address</label>
          <input type="email" id="up-email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Date of Birth</label>
          <DateField value={dob} onChange={setDob} />
        </div>
        <div className="field">
          <label>Mobile Number</label>
          <input type="tel" value={user.mobile || ''} disabled />
        </div>
        <div className="error-msg">{error}</div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave} disabled={busy}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
