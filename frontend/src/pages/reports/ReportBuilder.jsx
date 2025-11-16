import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ReportBuilder = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'sales',
    dateRange: { start: '', end: '' },
    filters: {},
    format: 'pdf'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'promotion', label: 'Promotion Performance' },
    { value: 'customer', label: 'Customer Analysis' },
    { value: 'product', label: 'Product Performance' },
    { value: 'budget', label: 'Budget Analysis' },
    { value: 'roi', label: 'ROI Analysis' }
  ];

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/reports/generate`, reportConfig, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: reportConfig.format === 'pdf' ? 'blob' : 'json'
      });

      if (reportConfig.format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        console.log('Report data:', response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📊 Report Builder</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Create custom reports with flexible filters and export options</p>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', border: '1px solid #ddd' }}>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Report Type</label>
          <select
            value={reportConfig.reportType}
            onChange={(e) => setReportConfig(prev => ({ ...prev, reportType: e.target.value }))}
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
          >
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
            <input
              type="date"
              value={reportConfig.dateRange.start}
              onChange={(e) => setReportConfig(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>End Date</label>
            <input
              type="date"
              value={reportConfig.dateRange.end}
              onChange={(e) => setReportConfig(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Export Format</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            {['pdf', 'excel', 'csv'].map(format => (
              <label key={format} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value={format}
                  checked={reportConfig.format === format}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                  style={{ marginRight: '8px' }}
                />
                {format.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '5px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={loading || !reportConfig.dateRange.start || !reportConfig.dateRange.end}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : '📥 Generate Report'}
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>📝 Report Features</h3>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li>Export to PDF, Excel, or CSV formats</li>
          <li>Flexible date range selection</li>
          <li>Multiple report types available</li>
          <li>Real-time data analysis</li>
          <li>Customizable filters and metrics</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportBuilder;
