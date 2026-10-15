import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDateDMY, calcAge } from '../lib/dateFormat';
import { RELATIONSHIP_OPTIONS, isValidMobile } from '../lib/validators';
import ExportModal from '../components/ExportModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const BLANK_ROW = { name: '', dateOfBirth: '', relationship: '', mobile: '', livingTogether: '', _editing: true };

function sortDraft(rows) {
  return [...rows].sort((a, b) => {
    const aSelf = a.relationship === 'Self' ? 0 : 1;
    const bSelf = b.relationship === 'Self' ? 0 : 1;
    return aSelf - bSelf;
  });
}

export default function FamilyPage() {
  const [draft, setDraft] = useState([]);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);

  function load() {
    api.getFamilyMembers().then((data) => {
      setDraft(sortDraft(data.map((m) => ({ ...m, _editing: false }))));
    }).catch((err) => setError(err.message || 'Could not load family members.'));
  }

  useEffect(load, []);

  function updateField(idx, field, value) {
    setDraft((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function toggleEdit(idx) {
    setDraft((prev) => prev.map((m, i) => (i === idx ? { ...m, _editing: true } : m)));
  }

  function addRow() {
    setDraft((prev) => [...prev, { ...BLANK_ROW }]);
  }

  function removeRow(idx) {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  }

  function confirmRemoveRow() {
    if (deleteIdx !== null) {
      removeRow(deleteIdx);
      setDeleteIdx(null);
    }
  }

  function cancelEdit() {
    setError('');
    load();
  }

  async function handleSave() {
    const cleaned = draft.filter((m) => !m.isSelf).filter((m) =>
      (m.name && m.name.trim()) || m.dateOfBirth || m.relationship || (m.mobile && m.mobile.trim()) || m.livingTogether
    );

    for (const m of cleaned) {
      if (!m.name || !m.name.trim()) {
        setError('Please enter a name for every family member row.');
        return;
      }
      if (!m.relationship) {
        setError(`Please select a relationship for ${m.name}.`);
        return;
      }
      if (!m.livingTogether) {
        setError(`Please select "Living Together" (Yes/No) for ${m.name}.`);
        return;
      }
      if (m.mobile && !isValidMobile(m.mobile)) {
        setError(`Please enter a valid 10-digit mobile number for ${m.name}, or leave it blank.`);
        return;
      }
    }

    setError('');
    try {
      const payload = cleaned.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        dateOfBirth: m.dateOfBirth || null,
        relationship: m.relationship,
        mobile: m.mobile || '',
        livingTogether: m.livingTogether,
      }));
      const updated = await api.saveFamilyMembers(payload);
      setDraft(sortDraft(updated.map((m) => ({ ...m, _editing: false }))));
    } catch (err) {
      setError(err.message || 'Could not save family members.');
    }
  }

  const rows = draft.length > 0 ? draft : [{ ...BLANK_ROW }];

  const exportRows = draft.map((m, idx) => ({
    'Sr#': idx + 1,
    Name: m.name || '',
    'Date of Birth': formatDateDMY(m.dateOfBirth) || '',
    Age: calcAge(m.dateOfBirth),
    Relationship: m.relationship || '',
    'Mobile No.': m.mobile || '',
    'Living Together': m.livingTogether || '',
  }));

  return (
    <div>
      <div className="view-header">
        <div>
          <h2>My Family</h2>
          <p className="section-subtitle">Manage your family members</p>
        </div>
        <button type="button" className="btn btn-secondary btn-export" onClick={() => setShowExport(true)}>
          &#8595; Export
        </button>
      </div>
      <div className="panel-card">
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sr-col">Sr#</th>
              <th>Name</th>
              <th>Date of Birth (dd/mm/yyyy)</th>
              <th>Age</th>
              <th>Relationship</th>
              <th>Mobile No.</th>
              <th>Living Together</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member, idx) => {
              const isSelf = member.relationship === 'Self';
              const age = calcAge(member.dateOfBirth);
              if (member._editing) {
                return (
                  <tr key={member.id ?? `new-${idx}`}>
                    <td className="sr-col">{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={member.name || ''}
                        placeholder="Full name"
                        onChange={(e) => updateField(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={member.dateOfBirth || ''}
                        onChange={(e) => updateField(idx, 'dateOfBirth', e.target.value)}
                      />
                    </td>
                    <td><input type="text" value={age} disabled placeholder="Auto-calculated" /></td>
                    <td>
                      <select value={member.relationship || ''} onChange={(e) => updateField(idx, 'relationship', e.target.value)}>
                        <option value="">Select</option>
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {isSelf ? (
                        <input type="tel" value={member.mobile || ''} disabled placeholder="From profile" />
                      ) : (
                        <input
                          type="tel"
                          maxLength={10}
                          value={member.mobile || ''}
                          placeholder="Mobile no."
                          onChange={(e) => updateField(idx, 'mobile', e.target.value.replace(/[^0-9]/g, ''))}
                        />
                      )}
                    </td>
                    <td>
                      {isSelf ? (
                        <input type="text" value="NA" disabled />
                      ) : (
                        <select value={member.livingTogether || ''} onChange={(e) => updateField(idx, 'livingTogether', e.target.value)}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {!isSelf && (
                          <button type="button" className="remove-row-btn" title="Remove" onClick={() => setDeleteIdx(idx)}>&times;</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={member.id ?? `new-${idx}`}>
                  <td className="sr-col">{idx + 1}</td>
                  <td className="display-text">{member.name || ''}</td>
                  <td className={`display-text${member.dateOfBirth ? '' : ' muted'}`}>{formatDateDMY(member.dateOfBirth) || '-'}</td>
                  <td className={`display-text${age !== '' ? '' : ' muted'}`}>{age !== '' ? age : '-'}</td>
                  <td className="display-text">{member.relationship || '-'}</td>
                  <td className={`display-text${member.mobile ? '' : ' muted'}`}>{member.mobile || '-'}</td>
                  <td className="display-text">{member.livingTogether || '-'}</td>
                  <td>
                    <div className="row-actions">
                      {!isSelf && (
                        <>
                          <button type="button" className="edit-row-btn" title="Update" onClick={() => toggleEdit(idx)}>&#9998;</button>
                          <button type="button" className="remove-row-btn" title="Remove" onClick={() => setDeleteIdx(idx)}>&times;</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <button type="button" className="add-row-btn" onClick={addRow}>+ Add Family Member</button>
        <div className="error-msg">{error}</div>
        <div className="panel-actions">
          <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          <button type="button" className="btn" onClick={handleSave}>Save</button>
        </div>
      </div>

      {showExport && (
        <ExportModal title="My Family" rows={exportRows} fileBaseName="My_Family" onClose={() => setShowExport(false)} />
      )}

      {deleteIdx !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this family member?"
          onConfirm={confirmRemoveRow}
          onCancel={() => setDeleteIdx(null)}
        />
      )}
    </div>
  );
}
