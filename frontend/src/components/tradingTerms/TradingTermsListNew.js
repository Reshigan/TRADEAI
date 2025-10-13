import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

const TradingTermsListNew = () => {
  const navigate = useNavigate();
  const [tradingTerms, setTradingTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('TradingTermsListNew render - tradingTerms:', tradingTerms, 'type:', typeof tradingTerms, 'isArray:', Array.isArray(tradingTerms));

  useEffect(() => {
    fetchTradingTerms();
  }, []);

  const fetchTradingTerms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trading-terms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trading terms API response:', data);
        
        // Safely extract the trading terms array
        let tradingTermsArray = [];
        if (data && data.data && Array.isArray(data.data.tradingTerms)) {
          tradingTermsArray = data.data.tradingTerms;
        } else if (data && Array.isArray(data.data)) {
          tradingTermsArray = data.data;
        } else if (Array.isArray(data)) {
          tradingTermsArray = data;
        }
        
        console.log('Extracted trading terms array:', tradingTermsArray, 'length:', tradingTermsArray.length);
        setTradingTerms(tradingTermsArray);
      } else {
        setError('Failed to fetch trading terms');
      }
    } catch (error) {
      console.error('Error fetching trading terms:', error);
      setError('Failed to load trading terms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader
        title="Trading Terms"
        subtitle="Manage trading terms and conditions"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/trading-terms/new')}
          >
            Add Trading Term
          </Button>
        }
      />

      <Paper elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valid From</TableCell>
                <TableCell>Valid To</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(tradingTerms) && tradingTerms.length > 0 ? (
                tradingTerms.map((term, index) => (
                  <TableRow key={term._id || term.id || index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {term.name || 'N/A'}
                        </Typography>
                        {term.description && (
                          <Typography variant="body2" color="text.secondary">
                            {term.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {term.code || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {term.termType || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {term.approvalWorkflow?.status || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {term.validFrom ? new Date(term.validFrom).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {term.validTo ? new Date(term.validTo).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/trading-terms/${term._id || term.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No trading terms available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TradingTermsListNew;