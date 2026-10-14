import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportModal({ title, rows, fileBaseName, onClose }) {
  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
    onClose();
  }

  function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(title, 14, 16);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const body = rows.map((row) => columns.map((col) => String(row[col])));
      autoTable(doc, { head: [columns], body, startY: 22, styles: { fontSize: 8 } });
    }
    doc.save(`${fileBaseName}.pdf`);
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Export Data</h3>
        <p className="section-subtitle" style={{ margin: '0 0 4px' }}>Choose a file format to download</p>
        <div className="format-choice-row">
          <button type="button" className="format-choice-btn" onClick={exportExcel}>
            <span className="format-icon">&#128202;</span> Excel (.xlsx)
          </button>
          <button type="button" className="format-choice-btn" onClick={exportPdf}>
            <span className="format-icon">&#128196;</span> PDF (.pdf)
          </button>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
