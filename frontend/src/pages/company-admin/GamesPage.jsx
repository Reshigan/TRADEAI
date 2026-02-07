import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, CircularProgress,
  FormControlLabel, Switch, Tabs, Tab
} from '@mui/material';
import { Add, Edit, Delete, SportsEsports, EmojiEvents, Leaderboard } from '@mui/icons-material';
import enterpriseApi from '../../services/enterpriseApi';
import { formatLabel } from '../../utils/formatters';

const gameTypes = [
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'quiz', label: 'Quiz Competition' },
  { value: 'achievement', label: 'Achievement Badges' },
  { value: 'points_race', label: 'Points Race' },
  { value: 'team_competition', label: 'Team Competition' }
];

const gameCategories = [
  { value: 'sales', label: 'Sales' },
  { value: 'learning', label: 'Learning' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'performance', label: 'Performance' },
  { value: 'custom', label: 'Custom' }
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'paused', label: 'Paused', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'info' },
  { value: 'archived', label: 'Archived', color: 'error' }
];

const resetPeriods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'never', label: 'Never' }
];

const initialFormData = {
  name: '',
  description: '',
  type: 'leaderboard',
  category: 'engagement',
  status: 'draft',
  isPublic: true,
  startDate: '',
  endDate: '',
  config: {
    pointsPerAction: {
      login: 5,
      courseComplete: 50,
      quizPass: 25,
      promotionCreated: 30,
      budgetApproved: 20,
      customerVisit: 15
    },
    leaderboardSize: 10,
    resetPeriod: 'monthly',
    teamBased: false
  }
};

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadGames();
  }, [page, rowsPerPage, filterStatus]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await enterpriseApi.companyAdmin.getGames(params);
      setGames(response.data.games);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (game = null) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        name: game.name,
        description: game.description || '',
        type: game.type,
        category: game.category,
        status: game.status,
        isPublic: game.isPublic,
        startDate: game.startDate ? game.startDate.split('T')[0] : '',
        endDate: game.endDate ? game.endDate.split('T')[0] : '',
        config: game.config || initialFormData.config
      });
    } else {
      setEditingGame(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGame(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingGame) {
        await enterpriseApi.companyAdmin.updateGame((editingGame.id || editingGame._id), formData);
      } else {
        await enterpriseApi.companyAdmin.createGame(formData);
      }
      handleCloseDialog();
      loadGames();
    } catch (err) {
      setError(err.message || 'Failed to save game');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await enterpriseApi.companyAdmin.deleteGame(id);
      loadGames();
    } catch (err) {
      setError(err.message || 'Failed to delete game');
    }
  };

  const getStatusColor = (status) => {
    const s = statuses.find(st => st.value === status);
    return s ? s.color : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Games & Gamification</Typography>
          <Typography variant="body1" color="text.secondary">
            Create engaging games and competitions for your team
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Create Game
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={filterStatus} onChange={(e, v) => { setFilterStatus(v); setPage(0); }}>
          <Tab label="All Games" value="all" />
          <Tab label="Active" value="active" />
          <Tab label="Draft" value="draft" />
          <Tab label="Completed" value="completed" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id || game._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SportsEsports sx={{ mr: 1, color: 'warning.main' }} />
                        <Box>
                          <Typography variant="subtitle2">{game.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {game.description?.substring(0, 40)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={game.type === 'leaderboard' ? <Leaderboard /> : <EmojiEvents />}
                        label={gameTypes.find(t => t.value === game.type)?.label || game.type} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{gameCategories.find(c => c.value === game.category)?.label || game.category}</TableCell>
                    <TableCell>{game.participants?.length || 0}</TableCell>
                    <TableCell>{game.config?.resetPeriod || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={formatLabel(game.status)} size="small" color={getStatusColor(game.status)} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(game)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(game._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {games.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No games found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingGame ? 'Edit Game' : 'Create New Game'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Game Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Game Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {gameTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {gameCategories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statuses.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Configuration</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Reset Period"
                value={formData.config.resetPeriod}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, resetPeriod: e.target.value }
                })}
              >
                {resetPeriods.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Leaderboard Size"
                value={formData.config.leaderboardSize}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, leaderboardSize: parseInt(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.config.teamBased}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, teamBased: e.target.checked }
                    })}
                  />
                }
                label="Team Based"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Public (visible to all employees)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.name}>
            {saving ? 'Saving...' : 'Save Game'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
