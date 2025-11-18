import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const PromotionDocuments = ({ promotionId, promotion, onUpdate }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [promotionId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/documents`);
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      await apiClient.delete(`/promotions/${promotionId}/documents/${documentId}`);
      toast.success('Document deleted');
      loadDocuments();
      onUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Documents</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={promotion.status !== 'draft'}
        >
          Upload Document
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No documents uploaded yet
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>{doc.name || doc.filename || 'Untitled'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={doc.type || doc.mimeType || 'Unknown'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(doc.size)}</TableCell>
                  <TableCell>{formatDate(doc.uploadedAt || doc.createdAt)}</TableCell>
                  <TableCell>{doc.uploadedBy?.name || doc.uploadedBy?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      title="Download"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc._id)}
                      disabled={promotion.status !== 'draft'}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PromotionDocuments;
