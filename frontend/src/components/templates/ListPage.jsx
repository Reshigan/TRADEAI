import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ViewList as ListViewIcon,
  CalendarMonth as CalendarViewIcon,
  ViewKanban as KanbanViewIcon,
} from '@mui/icons-material';

const KPICard = ({ label, value, change, loading }) => (
  <Card
    sx={{
      p: 2,
      border: '1px solid #E2E8F0',
      boxShadow: 'none',
      borderRadius: '12px',
      flex: 1,
      minWidth: 140,
      '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    }}
  >
    {loading ? (
      <>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={28} sx={{ mt: 0.5 }} />
      </>
    ) : (
      <>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>{value}</Typography>
          {change !== undefined && (
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: change >= 0 ? '#059669' : '#EF4444' }}>
              {change >= 0 ? '+' : ''}{change}%
            </Typography>
          )}
        </Box>
      </>
    )}
  </Card>
);

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    {icon && <Box sx={{ mb: 2, color: '#94A3B8', fontSize: 48 }}>{icon}</Box>}
    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ fontSize: '0.875rem', color: '#64748B', mb: 3 }}>{description}</Typography>
    {actionLabel && (
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAction} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

const ListPage = ({
  title,
  subtitle,
  kpis = [],
  loading = false,
  children,
  onAdd,
  addLabel = 'Create New',
  searchPlaceholder = 'Search...',
  onSearch,
  filters,
  viewModes,
  activeView = 'list',
  onViewChange,
  pagination,
  emptyState,
  headerActions,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const viewIcons = {
    list: <ListViewIcon />,
    calendar: <CalendarViewIcon />,
    kanban: <KanbanViewIcon />,
  };

  return (
    <Box>
      {kpis.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} loading={loading} />
          ))}
        </Box>
      )}

      <Card sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '12px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0' }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 220,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.8125rem' },
            }}
          />

          {filters && (
            <>
              <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', width: 36, height: 36 }}>
                <FilterIcon sx={{ fontSize: 18, color: '#64748B' }} />
              </IconButton>
              <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)} PaperProps={{ sx: { borderRadius: '12px', mt: 1 } }}>
                {filters.map((f, i) => (
                  <MenuItem key={i} onClick={() => { f.onClick?.(); setFilterAnchor(null); }} sx={{ fontSize: '0.8125rem' }}>
                    {f.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {viewModes && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              {viewModes.map((mode) => (
                <IconButton
                  key={mode}
                  onClick={() => onViewChange?.(mode)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: activeView === mode ? '#1E40AF' : 'transparent',
                    color: activeView === mode ? '#FFFFFF' : '#64748B',
                    '&:hover': { bgcolor: activeView === mode ? '#1E3A8A' : '#F1F5F9' },
                  }}
                >
                  {viewIcons[mode] || <ListViewIcon />}
                </IconButton>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, ml: viewModes ? 0 : 'auto' }}>
            {headerActions}
            {onAdd && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
              >
                {addLabel}
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ minHeight: 200 }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: '8px' }} />
              ))}
            </Box>
          ) : children ? (
            children
          ) : emptyState ? (
            <EmptyState {...emptyState} />
          ) : (
            <EmptyState title="No data found" description="Try adjusting your search or filters" />
          )}
        </Box>

        {pagination && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #E2E8F0' }}>
            <Pagination
              count={pagination.totalPages || 1}
              page={pagination.page || 1}
              onChange={pagination.onChange}
              size="small"
              shape="rounded"
            />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export { KPICard, EmptyState };
export default ListPage;
