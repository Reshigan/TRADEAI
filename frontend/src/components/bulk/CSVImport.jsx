import React, { useState } from 'react';
import axios from 'axios';
import './CSVImport.css';

const CSVImport = ({ entityType, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || '/api'}/${entityType}s/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setResult({
        success: response.data.imported || 0,
        failed: response.data.failed || 0,
        total: response.data.total || 0
      });
      
      setFile(null);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      promotion: 'name,type,startDate,endDate,discount,status\n"Summer Sale",percentage,2024-06-01,2024-06-30,20,active',
      campaign: 'name,type,startDate,endDate,budget,status\n"Q2 Campaign",awareness,2024-04-01,2024-06-30,50000,planned',
      customer: 'name,email,phone,company,tier,status\n"John Doe",john@example.com,+27123456789,"ACME Corp",gold,active',
      product: 'name,sku,category,price,cost,stock,status\n"Product A",SKU001,beverages,29.99,15.00,100,active',
      vendor: 'name,contactPerson,email,phone,rating,status\n"Vendor A","Jane Smith",jane@vendor.com,+27987654321,5,active'
    };

    const csvContent = templates[entityType] || 'No template available';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-import">
      <h3>Import {entityType}s from CSV</h3>
      
      <div className="import-actions">
        <button onClick={downloadTemplate} className="btn-secondary">
          📥 Download Template
        </button>
      </div>

      <div className="file-input-wrapper">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          id="csv-file"
          className="file-input"
        />
        <label htmlFor="csv-file" className="file-label">
          {file ? file.name : 'Choose CSV file...'}
        </label>
      </div>

      {error && <div className="import-error">{error}</div>}
      
      {result && (
        <div className="import-result">
          <p className="result-success">✅ Successfully imported: {result.success}</p>
          {result.failed > 0 && (
            <p className="result-warning">⚠️ Failed: {result.failed}</p>
          )}
          <p className="result-total">Total processed: {result.total}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary upload-btn"
      >
        {uploading ? 'Uploading...' : '⬆️ Upload & Import'}
      </button>
    </div>
  );
};

export default CSVImport;
