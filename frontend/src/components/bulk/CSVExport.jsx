import React, { useState } from 'react';
import api from '../../services/api';
import './CSVExport.css';

const CSVExport = ({ entityType, filters = {} }) => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      const params = new URLSearchParams(filters);
      const response = await api.get(
        `/${entityType}s/export?${params}`,
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entityType}s_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="csv-export">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="btn-export"
      >
        {exporting ? '⏳ Exporting...' : '📤 Export to CSV'}
      </button>
      {error && <div className="export-error">{error}</div>}
    </div>
  );
};

export default CSVExport;
