import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../common/ToastNotification';
import './GlobalSearch.css';

const GlobalSearch = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/search?q=${query}`);
      setResults(response.data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    const routes = {
      promotion: '/promotions',
      campaign: '/campaigns',
      customer: '/customers',
      product: '/products',
      vendor: '/vendors'
    };
    const basePath = routes[result.type] || '/';
    navigate(`${basePath}/${result.id || result._id}`);
    setQuery('');
    setShowResults(false);
  };

  const getIcon = (type) => {
    const icons = {
      promotion: '🎯',
      campaign: '📢',
      customer: '👤',
      product: '📦',
      vendor: '🏢'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="global-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search promotions, campaigns, customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="search-input"
        />
        {loading && <div className="search-loader">🔍</div>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id || result._id}`}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <span className="result-icon">{getIcon(result.type)}</span>
              <div className="result-content">
                <div className="result-title">{result.name}</div>
                <div className="result-type">{result.type}</div>
              </div>
              {result.status && (
                <span className={`result-status status-${result.status}`}>
                  {result.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="search-results">
          <div className="no-results">No results found for "{query}"</div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
