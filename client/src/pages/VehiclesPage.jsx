import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDateDMY } from '../lib/dateFormat';
import { VEHICLE_TYPE_OPTIONS, VEHICLE_MAKE_OPTIONS, getVehicleModelYearOptions, isValidRegNo } from '../lib/validators';
import ExportModal from '../components/ExportModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DateField from '../components/DateField.jsx';

const BLANK_ROW = { registrationNo: '', vehicleType: '', make: '', modelYear: '', insurancePolicy: '', pollutionUpto: '', _editing: true };

export default function VehiclesPage() {
  const [draft, setDraft] = useState([]);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const modelYears = getVehicleModelYearOptions();

  function load() {
    api.getVehicles().then((data) => {
      setDraft(data.map((v) => ({ ...v, _editing: false })));
    }).catch((err) => setError(err.message || 'Could not load vehicles.'));
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
    setDraft((prev) => prev.map((v, i) => (i === idx ? { ...v, _editing: true } : v)));
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
    const cleaned = draft.filter((v) =>
      (v.registrationNo && v.registrationNo.trim()) || v.vehicleType || (v.make && v.make.trim()) ||
      v.modelYear || (v.insurancePolicy && v.insurancePolicy.trim()) || v.pollutionUpto
    );

    for (const v of cleaned) {
      if (!v.registrationNo || !v.registrationNo.trim()) { setError('Please enter a registration number for every vehicle row.'); return; }
      if (!isValidRegNo(v.registrationNo.trim().toUpperCase())) {
        setError(`Please enter a valid Indian RTO registration number for ${v.registrationNo} (e.g. MH12AB1234).`);
        return;
      }
      if (!v.vehicleType) { setError(`Please select a vehicle type for ${v.registrationNo}.`); return; }
      if (!v.make || !v.make.trim()) { setError(`Please enter the make for ${v.registrationNo}.`); return; }
      if (!v.modelYear) { setError(`Please select a model year for ${v.registrationNo}.`); return; }
    }

    setError('');
    try {
      const payload = cleaned.map((v) => ({
        id: v.id,
        registrationNo: v.registrationNo.trim().toUpperCase(),
        vehicleType: v.vehicleType,
        make: v.make.trim(),
        modelYear: Number(v.modelYear),
        insurancePolicy: v.insurancePolicy || '',
        pollutionUpto: v.pollutionUpto || null,
      }));
      const updated = await api.saveVehicles(payload);
      setDraft(updated.map((v) => ({ ...v, _editing: false })));
    } catch (err) {
      setError(err.message || 'Could not save vehicles.');
    }
  }

  const rows = draft.length > 0 ? draft : [{ ...BLANK_ROW }];

  const exportRows = draft.map((v, idx) => ({
    'Sr#': idx + 1,
    'Registration No.': v.registrationNo || '',
    'Vehicle Type': v.vehicleType || '',
    Make: v.make || '',
    'Model (Year)': v.modelYear || '',
    'Insurance Policy': v.insurancePolicy || '',
    'Pollution Certificate Upto': formatDateDMY(v.pollutionUpto) || '',
  }));

  return (
    <div>
      <div className="view-header">
        <div>
          <h2>My Vehicles</h2>
          <p className="section-subtitle">Manage your registered vehicles</p>
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
              <th>Registration No.</th>
              <th>Vehicle Type</th>
              <th>Make</th>
              <th>Model (Year)</th>
              <th>Insurance Policy</th>
              <th>Pollution Certificate Upto</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((vehicle, idx) => {
              if (vehicle._editing) {
                return (
                  <tr key={vehicle.id ?? `new-${idx}`}>
                    <td className="sr-col">{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        style={{ textTransform: 'uppercase' }}
                        value={vehicle.registrationNo || ''}
                        placeholder="e.g. MH12AB1234"
                        onChange={(e) => updateField(idx, 'registrationNo', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <select value={vehicle.vehicleType || ''} onChange={(e) => updateField(idx, 'vehicleType', e.target.value)}>
                        <option value="">Select</option>
                        {VEHICLE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={vehicle.make || ''} onChange={(e) => updateField(idx, 'make', e.target.value)}>
                        <option value="">Select</option>
                        {VEHICLE_MAKE_OPTIONS.map((mk) => <option key={mk} value={mk}>{mk}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={vehicle.modelYear || ''} onChange={(e) => updateField(idx, 'modelYear', e.target.value)}>
                        <option value="">Select</option>
                        {modelYears.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </td>
                    <td><input type="text" value={vehicle.insurancePolicy || ''} placeholder="Policy no." onChange={(e) => updateField(idx, 'insurancePolicy', e.target.value)} /></td>
                    <td><DateField value={vehicle.pollutionUpto} onChange={(v) => updateField(idx, 'pollutionUpto', v)} /></td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="remove-row-btn" title="Remove" onClick={() => setDeleteIdx(idx)}>&times;</button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={vehicle.id ?? `new-${idx}`}>
                  <td className="sr-col">{idx + 1}</td>
                  <td className="display-text">{vehicle.registrationNo || '-'}</td>
                  <td className="display-text">{vehicle.vehicleType || '-'}</td>
                  <td className="display-text">{vehicle.make || '-'}</td>
                  <td className="display-text">{vehicle.modelYear || '-'}</td>
                  <td className={`display-text${vehicle.insurancePolicy ? '' : ' muted'}`}>{vehicle.insurancePolicy || '-'}</td>
                  <td className={`display-text${vehicle.pollutionUpto ? '' : ' muted'}`}>{formatDateDMY(vehicle.pollutionUpto) || '-'}</td>
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
        </div>
        <button type="button" className="add-row-btn" onClick={addRow}>+ Add Vehicle</button>
        <div className="error-msg">{error}</div>
        <div className="panel-actions">
          <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          <button type="button" className="btn" onClick={handleSave}>Save</button>
        </div>
      </div>

      {showExport && (
        <ExportModal title="My Vehicles" rows={exportRows} fileBaseName="My_Vehicles" onClose={() => setShowExport(false)} />
      )}

      {deleteIdx !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this vehicle?"
          onConfirm={confirmRemoveRow}
          onCancel={() => setDeleteIdx(null)}
        />
      )}
    </div>
  );
}
