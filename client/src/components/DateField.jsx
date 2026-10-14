import { formatDateDMY } from '../lib/dateFormat';

/** Ports MyBox.html's .date-field calendar-icon trick: a readonly DD/MM/YYYY display
 * overlaid with a transparent native <input type="date"> that drives the real value. */
export default function DateField({ value, onChange, disabled }) {
  return (
    <div className="date-field">
      <input type="text" className="date-display" value={formatDateDMY(value) || 'dd/mm/yyyy'} readOnly />
      <input
        type="date"
        className="date-native"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="date-icon">&#128197;</span>
    </div>
  );
}
