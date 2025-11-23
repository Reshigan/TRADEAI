import React, { useState } from 'react';
import {
  Box,
  Paper,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
  Typography
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Bookmark as BookmarkIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const FilterBar = ({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  
  savedViews = [],
  currentView = null,
  onSaveView,
  onLoadView,
  onDeleteView,
  showSavedViews = true,
  
  sx = {}
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewsAnchorEl, setViewsAnchorEl] = useState(null);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleFilterMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewsMenuOpen = (event) => {
    setViewsAnchorEl(event.currentTarget);
  };

  const handleViewsMenuClose = () => {
    setViewsAnchorEl(null);
  };

  const handleFilterChange = (filterKey, value) => {
    onFilterChange({
      ...activeFilters,
      [filterKey]: value
    });
    handleFilterMenuClose();
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    onClearFilters();
  };

  const handleSaveView = () => {
    if (newViewName.trim() && onSaveView) {
      onSaveView({
        name: newViewName,
        filters: activeFilters
      });
      setNewViewName('');
      setSaveViewDialogOpen(false);
    }
  };

  const handleLoadView = (view) => {
    if (onLoadView) {
      onLoadView(view);
    }
    handleViewsMenuClose();
  };

  const activeFilterCount = Object.keys(activeFilters).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Paper sx={{ p: 2, mb: 2, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {/* Filter button */}
        <Button
          startIcon={<FilterIcon />}
          onClick={handleFilterMenuOpen}
          variant={hasActiveFilters ? 'contained' : 'outlined'}
          size="small"
        >
          Filters {hasActiveFilters && `(${activeFilterCount})`}
        </Button>

        {/* Saved views button */}
        {showSavedViews && (
          <Button
            startIcon={<BookmarkIcon />}
            onClick={handleViewsMenuOpen}
            variant="outlined"
            size="small"
          >
            Views
          </Button>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            {Object.entries(activeFilters).map(([key, value]) => {
              const filter = filters.find(f => f.key === key);
              const label = filter ? `${filter.label}: ${value}` : `${key}: ${value}`;
              
              return (
                <Chip
                  key={key}
                  label={label}
                  size="small"
                  onDelete={() => handleRemoveFilter(key)}
                  color="primary"
                  variant="outlined"
                />
              );
            })}
            
            <Tooltip title="Clear all filters">
              <IconButton size="small" onClick={handleClearAll}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Current view indicator */}
        {currentView && (
          <Chip
            label={`View: ${currentView.name}`}
            size="small"
            color="secondary"
            icon={<BookmarkIcon />}
          />
        )}
      </Box>

      {/* Filter menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: { minWidth: 300, p: 2 }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, px: 1 }}>
          Add Filters
        </Typography>
        
        {filters.map((filter) => (
          <Box key={filter.key} sx={{ mb: 2 }}>
            {filter.type === 'select' ? (
              <FormControl fullWidth size="small">
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  label={filter.label}
                >
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                size="small"
                label={filter.label}
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                type={filter.type || 'text'}
              />
            )}
          </Box>
        ))}

        {hasActiveFilters && onSaveView && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              startIcon={<SaveIcon />}
              onClick={() => {
                setSaveViewDialogOpen(true);
                handleFilterMenuClose();
              }}
              variant="outlined"
              size="small"
            >
              Save as View
            </Button>
          </>
        )}
      </Menu>

      {/* Saved views menu */}
      <Menu
        anchorEl={viewsAnchorEl}
        open={Boolean(viewsAnchorEl)}
        onClose={handleViewsMenuClose}
        PaperProps={{
          sx: { minWidth: 250 }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Saved Views
        </Typography>
        <Divider />
        
        {savedViews.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No saved views
            </Typography>
          </MenuItem>
        ) : (
          savedViews.map((view) => (
            <MenuItem
              key={view.id}
              onClick={() => handleLoadView(view)}
              selected={currentView?.id === view.id}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Typography variant="body2">{view.name}</Typography>
                {onDeleteView && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteView(view.id);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Save view dialog (simple inline version) */}
      {saveViewDialogOpen && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Save Current View
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveView();
                }
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveView}
              disabled={!newViewName.trim()}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSaveViewDialogOpen(false);
                setNewViewName('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FilterBar;
