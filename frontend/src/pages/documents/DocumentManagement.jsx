import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, CircularProgress, Alert, Tooltip, InputAdornment, Card, CardContent,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Breadcrumbs, Link,
  Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  Description as DocIcon, Folder as FolderIcon, FolderOpen as FolderOpenIcon,
  CloudUpload as UploadIcon, Visibility as ViewIcon, Comment as CommentIcon,
  CreateNewFolder as NewFolderIcon, ArrowBack as BackIcon,
  InsertDriveFile as FileIcon, PictureAsPdf as PdfIcon,
  Image as ImageIcon, TableChart as SpreadsheetIcon,
  Article as ArticleIcon, Refresh as RefreshIcon,
  CheckCircle as ResolveIcon
} from '@mui/icons-material';
import { documentService } from '../../services/api';

const statusColors = {
  active: 'success', archived: 'default', draft: 'warning',
  pending_approval: 'info', expired: 'error', deleted: 'error'
};

const getFileIcon = (fileType) => {
  if (!fileType) return <FileIcon />;
  if (fileType.includes('pdf')) return <PdfIcon sx={{ color: '#E53935' }} />;
  if (fileType.includes('image')) return <ImageIcon sx={{ color: '#43A047' }} />;
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return <SpreadsheetIcon sx={{ color: '#1E88E5' }} />;
  if (fileType.includes('doc') || fileType.includes('word')) return <ArticleIcon sx={{ color: '#1565C0' }} />;
  return <FileIcon sx={{ color: '#757575' }} />;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #E5E7EB' }} elevation={0}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
    </CardContent>
  </Card>
);

const DocumentManagement = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [docPagination, setDocPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [docFilters, setDocFilters] = useState({ status: '', document_type: '', category: '', search: '' });

  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);

  const [docDialog, setDocDialog] = useState(false);
  const [folderDialog, setFolderDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [docForm, setDocForm] = useState({
    name: '', description: '', documentType: 'general', category: 'other',
    status: 'active', fileName: '', fileType: '', fileSize: 0, fileUrl: '',
    entityType: '', entityId: '', entityName: '', tags: '', accessLevel: 'private',
    expiresAt: '', notes: ''
  });

  const [folderForm, setFolderForm] = useState({
    name: '', description: '', color: '#7C3AED', accessLevel: 'private'
  });

  const [commentText, setCommentText] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const res = await documentService.getSummary();
      if (res.success) setSummary(res.data);
    } catch (err) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await documentService.getOptions();
      if (res.success) setOptions(res.data);
    } catch (err) { /* ignore */ }
  }, []);

  const loadDocuments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: docPagination.limit };
      if (docFilters.status) params.status = docFilters.status;
      if (docFilters.document_type) params.document_type = docFilters.document_type;
      if (docFilters.category) params.category = docFilters.category;
      if (docFilters.search) params.search = docFilters.search;
      if (currentFolder) params.parent_id = currentFolder.id;
      const res = await documentService.getDocuments(params);
      if (res.success) {
        setDocuments(res.data || []);
        setDocPagination(res.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [docFilters, docPagination.limit, currentFolder]);

  const loadFolders = useCallback(async () => {
    try {
      const params = {};
      if (currentFolder) params.parent_id = currentFolder.id;
      const res = await documentService.getFolders(params);
      if (res.success) setFolders(res.data || []);
    } catch (err) { /* ignore */ }
  }, [currentFolder]);

  useEffect(() => {
    loadSummary();
    loadOptions();
  }, [loadSummary, loadOptions]);

  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, [loadDocuments, loadFolders]);

  const handleCreateDoc = async () => {
    try {
      setLoading(true);
      const payload = { ...docForm };
      if (currentFolder) payload.parentId = currentFolder.id;
      if (editingDoc) {
        await documentService.updateDocument(editingDoc.id, payload);
      } else {
        await documentService.createDocument(payload);
      }
      setDocDialog(false);
      setEditingDoc(null);
      resetDocForm();
      loadDocuments();
      loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      loadDocuments();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDoc = async (doc) => {
    try {
      const res = await documentService.getDocumentById(doc.id);
      if (res.success) {
        setSelectedDoc(res.data);
        setDetailDialog(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateFolder = async () => {
    try {
      setLoading(true);
      const payload = { ...folderForm };
      if (currentFolder) payload.parentId = currentFolder.id;
      if (editingFolder) {
        await documentService.updateFolder(editingFolder.id, payload);
      } else {
        await documentService.createFolder(payload);
      }
      setFolderDialog(false);
      setEditingFolder(null);
      setFolderForm({ name: '', description: '', color: '#7C3AED', accessLevel: 'private' });
      loadFolders();
      loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder? It must be empty.')) return;
    try {
      await documentService.deleteFolder(id);
      loadFolders();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const navigateToFolder = (folder) => {
    setFolderPath(prev => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolder(null);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedDoc) return;
    try {
      await documentService.addComment(selectedDoc.id, { content: commentText });
      setCommentText('');
      const res = await documentService.getDocumentById(selectedDoc.id);
      if (res.success) setSelectedDoc(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      await documentService.resolveComment(commentId);
      const res = await documentService.getDocumentById(selectedDoc.id);
      if (res.success) setSelectedDoc(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetDocForm = () => {
    setDocForm({
      name: '', description: '', documentType: 'general', category: 'other',
      status: 'active', fileName: '', fileType: '', fileSize: 0, fileUrl: '',
      entityType: '', entityId: '', entityName: '', tags: '', accessLevel: 'private',
      expiresAt: '', notes: ''
    });
  };

  const openEditDoc = (doc) => {
    setEditingDoc(doc);
    setDocForm({
      name: doc.name || '', description: doc.description || '',
      documentType: doc.documentType || 'general', category: doc.category || 'other',
      status: doc.status || 'active', fileName: doc.fileName || '',
      fileType: doc.fileType || '', fileSize: doc.fileSize || 0,
      fileUrl: doc.fileUrl || '', entityType: doc.entityType || '',
      entityId: doc.entityId || '', entityName: doc.entityName || '',
      tags: doc.tags || '', accessLevel: doc.accessLevel || 'private',
      expiresAt: doc.expiresAt || '', notes: doc.notes || ''
    });
    setDocDialog(true);
  };

  const openEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name || '', description: folder.description || '',
      color: folder.color || '#7C3AED', accessLevel: folder.accessLevel || 'private'
    });
    setFolderDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Document Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Organize, share, and track documents across your trade promotion workflows
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadDocuments(); loadFolders(); loadSummary(); }}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<NewFolderIcon />} onClick={() => { setEditingFolder(null); setFolderForm({ name: '', description: '', color: '#7C3AED', accessLevel: 'private' }); setFolderDialog(true); }}>
            New Folder
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingDoc(null); resetDocForm(); setDocDialog(true); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Upload Document
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><SummaryCard title="Total Documents" value={summary.totalDocuments} /></Grid>
          <Grid item xs={6} sm={3}><SummaryCard title="Active Documents" value={summary.activeDocuments} color="#059669" /></Grid>
          <Grid item xs={6} sm={3}><SummaryCard title="Folders" value={summary.totalFolders} color="#2563EB" /></Grid>
          <Grid item xs={6} sm={3}><SummaryCard title="Recent Uploads (7d)" value={summary.recentUploads} color="#D97706" /></Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Documents" icon={<DocIcon />} iconPosition="start" />
        <Tab label="Folders" icon={<FolderIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }} elevation={0}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search documents..." value={docFilters.search}
              onChange={(e) => setDocFilters(f => ({ ...f, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && loadDocuments(1)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ minWidth: 250 }} />
            {options && (
              <>
                <TextField select size="small" label="Type" value={docFilters.document_type}
                  onChange={(e) => { setDocFilters(f => ({ ...f, document_type: e.target.value })); }}
                  sx={{ minWidth: 150 }}>
                  <MenuItem value="">All Types</MenuItem>
                  {options.documentTypes?.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Category" value={docFilters.category}
                  onChange={(e) => { setDocFilters(f => ({ ...f, category: e.target.value })); }}
                  sx={{ minWidth: 150 }}>
                  <MenuItem value="">All Categories</MenuItem>
                  {options.categories?.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Status" value={docFilters.status}
                  onChange={(e) => { setDocFilters(f => ({ ...f, status: e.target.value })); }}
                  sx={{ minWidth: 130 }}>
                  <MenuItem value="">All</MenuItem>
                  {options.statuses?.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </>
            )}
            <Button variant="outlined" size="small" onClick={() => loadDocuments(1)}>Apply</Button>
          </Box>

          {folderPath.length > 0 && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Breadcrumbs>
                <Link component="button" underline="hover" onClick={navigateToRoot} sx={{ cursor: 'pointer' }}>Root</Link>
                {folderPath.map((f, i) => (
                  i === folderPath.length - 1
                    ? <Typography key={f.id} color="text.primary" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                    : <Link key={f.id} component="button" underline="hover" onClick={() => { setFolderPath(folderPath.slice(0, i + 1)); setCurrentFolder(f); }} sx={{ cursor: 'pointer' }}>{f.name}</Link>
                ))}
              </Breadcrumbs>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              {folders.length > 0 && (
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Folders</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {currentFolder && (
                      <Chip icon={<BackIcon />} label="Back" variant="outlined" onClick={navigateBack} />
                    )}
                    {folders.map(f => (
                      <Chip key={f.id} icon={<FolderIcon />} label={f.name} onClick={() => navigateToFolder(f)}
                        sx={{ bgcolor: f.color ? `${f.color}15` : '#F3F4F6' }} />
                    ))}
                  </Box>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No documents found</Typography>
                      </TableCell></TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDoc(doc)}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFileIcon(doc.fileType)}
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.name}</Typography>
                                {doc.fileName && <Typography variant="caption" color="text.secondary">{doc.fileName}</Typography>}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2">{doc.documentType?.replace(/_/g, ' ')}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{doc.category}</Typography></TableCell>
                          <TableCell>
                            {doc.entityType && <Typography variant="body2">{doc.entityType}: {doc.entityName || doc.entityId}</Typography>}
                          </TableCell>
                          <TableCell><Typography variant="body2">{formatFileSize(doc.fileSize)}</Typography></TableCell>
                          <TableCell><Chip label={doc.status} size="small" color={statusColors[doc.status] || 'default'} /></TableCell>
                          <TableCell><Typography variant="caption">{doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '-'}</Typography></TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="View"><IconButton size="small" onClick={() => handleViewDoc(doc)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDoc(doc)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteDoc(doc.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={docPagination.total} page={docPagination.page - 1}
                rowsPerPage={docPagination.limit} onPageChange={(_, p) => loadDocuments(p + 1)}
                onRowsPerPageChange={(e) => { setDocPagination(prev => ({ ...prev, limit: parseInt(e.target.value) })); loadDocuments(1); }}
              />
            </>
          )}
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }} elevation={0}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentFolder && (
                <IconButton size="small" onClick={navigateBack}><BackIcon /></IconButton>
              )}
              <Breadcrumbs>
                <Link component="button" underline="hover" onClick={navigateToRoot} sx={{ cursor: 'pointer' }}>Root</Link>
                {folderPath.map((f, i) => (
                  i === folderPath.length - 1
                    ? <Typography key={f.id} color="text.primary" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                    : <Link key={f.id} component="button" underline="hover" onClick={() => { setFolderPath(folderPath.slice(0, i + 1)); setCurrentFolder(f); }} sx={{ cursor: 'pointer' }}>{f.name}</Link>
                ))}
              </Breadcrumbs>
            </Box>
            <Button variant="outlined" startIcon={<NewFolderIcon />} onClick={() => { setEditingFolder(null); setFolderForm({ name: '', description: '', color: '#7C3AED', accessLevel: 'private' }); setFolderDialog(true); }}>
              New Folder
            </Button>
          </Box>
          <List>
            {folders.length === 0 ? (
              <ListItem><ListItemText primary="No folders here" secondary="Create a folder to organize your documents" /></ListItem>
            ) : (
              folders.map(folder => (
                <ListItem key={folder.id} button onClick={() => navigateToFolder(folder)} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                  <ListItemIcon>
                    <FolderOpenIcon sx={{ color: folder.color || '#7C3AED' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{folder.name}</Typography>}
                    secondary={folder.description || `${folder.documentCount || 0} documents`}
                  />
                  <ListItemSecondaryAction>
                    <Chip label={folder.accessLevel || 'private'} size="small" variant="outlined" sx={{ mr: 1 }} />
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      )}

      {/* Document Create/Edit Dialog */}
      <Dialog open={docDialog} onClose={() => setDocDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingDoc ? 'Edit Document' : 'Upload Document'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Document Name" required value={docForm.name} onChange={(e) => setDocForm(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Document Type" value={docForm.documentType} onChange={(e) => setDocForm(f => ({ ...f, documentType: e.target.value }))}>
                {(options?.documentTypes || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Category" value={docForm.category} onChange={(e) => setDocForm(f => ({ ...f, category: e.target.value }))}>
                {(options?.categories || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Access Level" value={docForm.accessLevel} onChange={(e) => setDocForm(f => ({ ...f, accessLevel: e.target.value }))}>
                {(options?.accessLevels || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={docForm.description} onChange={(e) => setDocForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="File Name" value={docForm.fileName} onChange={(e) => setDocForm(f => ({ ...f, fileName: e.target.value }))} placeholder="e.g. contract_2025.pdf" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="File Type" value={docForm.fileType} onChange={(e) => setDocForm(f => ({ ...f, fileType: e.target.value }))} placeholder="e.g. application/pdf" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="File Size (bytes)" type="number" value={docForm.fileSize} onChange={(e) => setDocForm(f => ({ ...f, fileSize: parseInt(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="File URL" value={docForm.fileUrl} onChange={(e) => setDocForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Linked Entity Type" value={docForm.entityType} onChange={(e) => setDocForm(f => ({ ...f, entityType: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {(options?.entityTypes || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Entity ID" value={docForm.entityId} onChange={(e) => setDocForm(f => ({ ...f, entityId: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Entity Name" value={docForm.entityName} onChange={(e) => setDocForm(f => ({ ...f, entityName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Tags (comma-separated)" value={docForm.tags} onChange={(e) => setDocForm(f => ({ ...f, tags: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Expires At" type="date" value={docForm.expiresAt?.split('T')[0] || ''} onChange={(e) => setDocForm(f => ({ ...f, expiresAt: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={docForm.notes} onChange={(e) => setDocForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDocDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateDoc} disabled={!docForm.name} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingDoc ? 'Save Changes' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Folder Create/Edit Dialog */}
      <Dialog open={folderDialog} onClose={() => setFolderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingFolder ? 'Edit Folder' : 'New Folder'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Folder Name" required value={folderForm.name} onChange={(e) => setFolderForm(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={folderForm.description} onChange={(e) => setFolderForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Color" type="color" value={folderForm.color} onChange={(e) => setFolderForm(f => ({ ...f, color: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Access Level" value={folderForm.accessLevel} onChange={(e) => setFolderForm(f => ({ ...f, accessLevel: e.target.value }))}>
                {(options?.accessLevels || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFolderDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!folderForm.name} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingFolder ? 'Save Changes' : 'Create Folder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        {selectedDoc && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFileIcon(selectedDoc.fileType)}
                {selectedDoc.name}
                <Chip label={selectedDoc.status} size="small" color={statusColors[selectedDoc.status] || 'default'} sx={{ ml: 1 }} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2">{selectedDoc.documentType?.replace(/_/g, ' ')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2">{selectedDoc.category}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">File</Typography>
                  <Typography variant="body2">{selectedDoc.fileName || 'N/A'} ({formatFileSize(selectedDoc.fileSize)})</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Access</Typography>
                  <Typography variant="body2">{selectedDoc.accessLevel}</Typography>
                </Grid>
                {selectedDoc.entityType && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Linked Entity</Typography>
                    <Typography variant="body2">{selectedDoc.entityType}: {selectedDoc.entityName || selectedDoc.entityId}</Typography>
                  </Grid>
                )}
                {selectedDoc.expiresAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Expires</Typography>
                    <Typography variant="body2">{new Date(selectedDoc.expiresAt).toLocaleDateString()}</Typography>
                  </Grid>
                )}
                {selectedDoc.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2">{selectedDoc.description}</Typography>
                  </Grid>
                )}
                {selectedDoc.tags && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {selectedDoc.tags.split(',').map((tag, i) => <Chip key={i} label={tag.trim()} size="small" variant="outlined" />)}
                    </Box>
                  </Grid>
                )}
                {selectedDoc.fileUrl && (
                  <Grid item xs={12}>
                    <Button variant="outlined" startIcon={<UploadIcon />} href={selectedDoc.fileUrl} target="_blank">
                      Open File
                    </Button>
                  </Grid>
                )}

                {/* Version History */}
                {selectedDoc.versions && selectedDoc.versions.length > 1 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Version History</Typography>
                    <List dense>
                      {selectedDoc.versions.map(v => (
                        <ListItem key={v.id}>
                          <ListItemText
                            primary={`v${v.version} - ${v.fileName || 'No file'}`}
                            secondary={`${formatFileSize(v.fileSize)} - ${new Date(v.createdAt).toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {/* Comments */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    <CommentIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    Comments ({selectedDoc.comments?.length || 0})
                  </Typography>
                  {selectedDoc.comments?.length > 0 && (
                    <List dense>
                      {selectedDoc.comments.map(comment => (
                        <ListItem key={comment.id} sx={{ bgcolor: comment.isResolved ? '#F0FDF4' : '#F9FAFB', borderRadius: 1, mb: 0.5 }}>
                          <ListItemText
                            primary={comment.content}
                            secondary={`${comment.userName || 'User'} - ${new Date(comment.createdAt).toLocaleString()}`}
                          />
                          {!comment.isResolved && (
                            <ListItemSecondaryAction>
                              <Tooltip title="Resolve">
                                <IconButton size="small" onClick={() => handleResolveComment(comment.id)}>
                                  <ResolveIcon fontSize="small" color="success" />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="Add a comment..." value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} />
                    <Button variant="contained" size="small" onClick={handleAddComment} disabled={!commentText.trim()}
                      sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                      Post
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailDialog(false)}>Close</Button>
              <Button variant="outlined" onClick={() => { setDetailDialog(false); openEditDoc(selectedDoc); }}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;
