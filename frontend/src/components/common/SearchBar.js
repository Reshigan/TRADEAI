import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Chip,
  Divider,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Receipt,
  LocalOffer,
  People,
  Inventory,
  Description
} from '@mui/icons-material';

/**
 * ENHANCED GLOBAL SEARCH BAR
 * Quick search across all entities with keyboard shortcuts
 * Maintains theme with gradient accents
 */
const SearchBar = ({ onResultClick, placeholder = "Search anything... (Ctrl+K)" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock search results (replace with actual API call)
  const mockResults = [
    { type: 'trade-spend', icon: <Receipt />, title: 'Q4 Campaign Budget', subtitle: '$125,000', color: '#00ffff' },
    { type: 'promotion', icon: <LocalOffer />, title: 'Holiday Sale 2025', subtitle: 'Active', color: '#8b5cf6' },
    { type: 'customer', icon: <People />, title: 'Walmart Inc.', subtitle: '1,234 transactions', color: '#10b981' },
    { type: 'product', icon: <Inventory />, title: 'Product SKU-12345', subtitle: 'In Stock', color: '#f59e0b' },
    { type: 'report', icon: <Description />, title: 'Monthly Performance Report', subtitle: 'Last updated 2 days ago', color: '#ef4444' }
  ];

  useEffect(() => {
    // Keyboard shortcut: Ctrl+K or Cmd+K
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      setLoading(true);
      // Simulate API call with debounce
      const timer = setTimeout(() => {
        const filtered = mockResults.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filtered);
        setLoading(false);
        setShowResults(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    setShowResults(false);
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    if (onResultClick) {
      onResultClick(result);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        id="global-search"
        fullWidth
        size="small"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => searchTerm.length > 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#00ffff' }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            bgcolor: 'background.paper',
            '&:hover': {
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'
            },
            '&.Mui-focused': {
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)'
            }
          }
        }}
      />

      <Fade in={showResults}>
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Searching...
              </Typography>
            </Box>
          ) : results.length > 0 ? (
            <List sx={{ py: 0 }}>
              {results.map((result, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() => handleResultClick(result)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                        '& .result-icon': {
                          color: result.color
                        }
                      }
                    }}
                  >
                    <ListItemIcon
                      className="result-icon"
                      sx={{ 
                        minWidth: 40,
                        color: 'text.secondary',
                        transition: 'color 0.2s'
                      }}
                    >
                      {result.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {result.title}
                          </Typography>
                          <Chip
                            label={result.type}
                            size="small"
                            sx={{
                              height: 20,
                              bgcolor: `${result.color}20`,
                              color: result.color,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={result.subtitle}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for "{searchTerm}"
              </Typography>
            </Box>
          )}
          
          {results.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                  Press ↑↓ to navigate • Enter to select • Esc to close
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};

export default SearchBar;
