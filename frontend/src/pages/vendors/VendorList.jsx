import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const VendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [search]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = search ? `?search=${search}` : '';
      const response = await axios.get(`${API_BASE_URL}/vendors${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setVendors(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading vendors...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>🏢 Vendors</h1>
          <p>{vendors.length} vendors</p>
        </div>
        <button onClick={() => navigate('/vendors/new')} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + New Vendor
        </button>
      </div>

      <input
        type="text"
        placeholder="Search vendors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {vendors.map(vendor => (
          <div key={vendor._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white', cursor: 'pointer' }} onClick={() => navigate(`/vendors/${vendor._id}`)}>
            <h3 style={{ marginBottom: '10px' }}>{vendor.vendorName}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <strong>Code:</strong> {vendor.vendorCode}
            </div>
            {vendor.contactPerson && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Contact:</strong> {vendor.contactPerson}
              </div>
            )}
            {vendor.email && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Email:</strong> {vendor.email}
              </div>
            )}
            {vendor.phone && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Phone:</strong> {vendor.phone}
              </div>
            )}
            {vendor.location && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '5px' }}>
                📍 {vendor.location.city}, {vendor.location.state}
              </div>
            )}
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No vendors found</h3>
          <button onClick={() => navigate('/vendors/new')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            + Add Vendor
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorList;
