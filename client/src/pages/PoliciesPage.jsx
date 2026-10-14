import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDateDMY } from '../lib/dateFormat';
import { POLICY_TYPE_OPTIONS, EMI_FREQUENCY_OPTIONS } from '../lib/validators';
import ExportModal from '../components/ExportModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DateField from '../components/DateField.jsx';

const BLANK_ROW = {
  policyNo: '', bankName: '', policyType: '', startDate: '',
  policyTermYears: '', payingTermYears: '', emiFrequency: '', _editing: true,
};

export default function PoliciesPage() {
  const [draft, setDraft] = useState([]);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);

  function load() {
    api.getPolicies().then((data) => {
      setDraft(data.map((p) => ({ ...p, _editing: false })));
    }).catch((err) => setError(err.message || 'Could not load policies.'));
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
    setDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, _editing: true } : p)));
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
    const cleaned = draft.filter((p) =>
      (p.policyNo && p.policyNo.trim()) || (p.bankName && p.bankName.trim()) || p.policyType ||
      p.startDate || p.policyTermYears || p.payingTermYears || p.emiFrequency
    );

    for (const p of cleaned) {
      if (!p.policyNo || !p.policyNo.trim()) { setError('Please enter a policy number for every policy row.'); return; }
      if (!p.bankName || !p.bankName.trim()) { setError(`Please enter a bank name for policy ${p.policyNo}.`); return; }
      if (!p.policyType) { setError(`Please select a policy type for ${p.policyNo}.`); return; }
      if (!p.startDate) { setError(`Please select a start date for ${p.policyNo}.`); return; }
      if (!p.policyTermYears) { setError(`Please enter a policy term for ${p.policyNo}.`); return; }
      if (!p.payingTermYears) { setError(`Please enter a paying term for ${p.policyNo}.`); return; }
      if (!p.emiFrequency) { setError(`Please select an EMI frequency for ${p.policyNo}.`); return; }
    }

    setError('');
    try {
      const payload = cleaned.map((p) => ({
        id: p.id,
        policyNo: p.policyNo.trim(),
        bankName: p.bankName.trim(),
        policyType: p.policyType,
        startDate: p.startDate,
        policyTermYears: Number(p.policyTermYears),
        payingTermYears: Number(p.payingTermYears),
        emiFrequency: p.emiFrequency,
      }));
      const updated = await api.savePolicies(payload);
      setDraft(updated.map((p) => ({ ...p, _editing: false })));
    } catch (err) {
      setError(err.message || 'Could not save policies.');
    }
  }

  const rows = draft.length > 0 ? draft : [{ ...BLANK_ROW }];

  const exportRows = draft.map((p, idx) => ({
    'Sr#': idx + 1,
    'Policy No.': p.policyNo || '',
    'Bank Name': p.bankName || '',
    'Policy Type': p.policyType || '',
    'Start Date': formatDateDMY(p.startDate) || '',
    'Policy Term (yrs)': p.policyTermYears || '',
    'Paying Term (yrs)': p.payingTermYears || '',
    'Maturity Date': formatDateDMY(p.maturityDate) || '',
    'EMI Frequency': p.emiFrequency || '',
    'Next Premium Date': p.nextPremiumDate === null ? 'N/A' : (formatDateDMY(p.nextPremiumDate) || ''),
  }));

  return (
    <div>
      <div className="view-header">
        <div>
          <h2>My Policies</h2>
          <p className="section-subtitle">Manage your insurance policies</p>
        </div>
        <button type="button" className="btn btn-secondary btn-export" onClick={() => setShowExport(true)}>
          &#8595; Export
        </button>
      </div>
      <div className="panel-card">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sr-col">Sr#</th>
              <th>Policy No.</th>
              <th>Bank Name</th>
              <th>Policy Type</th>
              <th>Start Date</th>
              <th>Policy Term (yrs)</th>
              <th>Paying Term (yrs)</th>
              <th>Maturity Date</th>
              <th>EMI Frequency</th>
              <th>Next Premium Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((policy, idx) => {
              if (policy._editing) {
                return (
                  <tr key={policy.id ?? `new-${idx}`}>
                    <td className="sr-col">{idx + 1}</td>
                    <td><input type="text" value={policy.policyNo || ''} placeholder="Policy no." onChange={(e) => updateField(idx, 'policyNo', e.target.value)} /></td>
                    <td><input type="text" value={policy.bankName || ''} placeholder="Bank name" onChange={(e) => updateField(idx, 'bankName', e.target.value)} /></td>
                    <td>
                      <select value={policy.policyType || ''} onChange={(e) => updateField(idx, 'policyType', e.target.value)}>
                        <option value="">Select</option>
                        {POLICY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td><DateField value={policy.startDate} onChange={(v) => updateField(idx, 'startDate', v)} /></td>
                    <td><input type="number" min="0" max="60" value={policy.policyTermYears ?? ''} placeholder="Years" onChange={(e) => updateField(idx, 'policyTermYears', e.target.value)} /></td>
                    <td><input type="number" min="0" max="60" value={policy.payingTermYears ?? ''} placeholder="Years" onChange={(e) => updateField(idx, 'payingTermYears', e.target.value)} /></td>
                    <td><input type="text" value={formatDateDMY(policy.maturityDate) || '-'} disabled placeholder="Auto-calculated" /></td>
                    <td>
                      <select value={policy.emiFrequency || ''} onChange={(e) => updateField(idx, 'emiFrequency', e.target.value)}>
                        <option value="">Select</option>
                        {EMI_FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                    <td><input type="text" value={policy.nextPremiumDate === null ? 'N/A' : (formatDateDMY(policy.nextPremiumDate) || '-')} disabled placeholder="Auto-calculated" /></td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="remove-row-btn" title="Remove" onClick={() => setDeleteIdx(idx)}>&times;</button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={policy.id ?? `new-${idx}`}>
                  <td className="sr-col">{idx + 1}</td>
                  <td className="display-text">{policy.policyNo || '-'}</td>
                  <td className="display-text">{policy.bankName || '-'}</td>
                  <td className="display-text">{policy.policyType || '-'}</td>
                  <td className="display-text">{formatDateDMY(policy.startDate) || '-'}</td>
                  <td className="display-text">{policy.policyTermYears || '-'}</td>
                  <td className="display-text">{policy.payingTermYears || '-'}</td>
                  <td className={`display-text${policy.maturityDate ? '' : ' muted'}`}>{formatDateDMY(policy.maturityDate) || '-'}</td>
                  <td className="display-text">{policy.emiFrequency || '-'}</td>
                  <td className={`display-text${policy.nextPremiumDate ? '' : ' muted'}`}>
                    {policy.nextPremiumDate === null ? 'N/A' : (formatDateDMY(policy.nextPremiumDate) || '-')}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="edit-row-btn" title="Update" onClick={() => toggleEdit(idx)}>&#9998;</button>
                      <button type="button" className="remove-row-btn" title="Remove" onClick={() => setDeleteIdx(idx)}>&times;</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" className="add-row-btn" onClick={addRow}>+ Add Policy</button>
        <div className="error-msg">{error}</div>
        <div className="panel-actions">
          <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          <button type="button" className="btn" onClick={handleSave}>Save</button>
        </div>
      </div>

      {showExport && (
        <ExportModal title="My Policies" rows={exportRows} fileBaseName="My_Policies" onClose={() => setShowExport(false)} />
      )}

      {deleteIdx !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this policy?"
          onConfirm={confirmRemoveRow}
          onCancel={() => setDeleteIdx(null)}
        />
      )}
    </div>
  );
}
