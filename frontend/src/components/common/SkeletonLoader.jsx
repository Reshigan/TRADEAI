import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {[...Array(rows)].map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton key={colIndex} variant="rectangular" height={40} sx={{ flex: 1 }} />
        ))}
      </Box>
    ))}
  </Box>
);

export const CardSkeleton = ({ count = 3 }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={12} md={4} key={index}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export const DashboardSkeleton = () => (
  <Box>
    {/* Header */}
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={24} />
    </Box>

    {/* KPI Cards */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={36} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Decision Cards */}
    <Grid container spacing={3}>
      {[...Array(3)].map((_, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="80%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton variant="rectangular" width={60} height={24} />
                <Skeleton variant="rectangular" width={60} height={24} />
              </Box>
              <Skeleton variant="rectangular" height={36} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export const HierarchySkeleton = () => (
  <Box>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
    {[...Array(5)].map((_, index) => (
      <Box key={index} sx={{ ml: index * 2, mb: 1 }}>
        <Skeleton variant="rectangular" height={40} />
      </Box>
    ))}
  </Box>
);

export const ChartSkeleton = ({ height = 300 }) => (
  <Box>
    <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={height} />
  </Box>
);

export const DetailPageSkeleton = () => (
  <Box>
    {/* Header */}
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="50%" height={40} sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={80} height={28} />
        <Skeleton variant="rectangular" width={80} height={28} />
      </Box>
    </Box>

    {/* Content Grid */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <ChartSkeleton height={250} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
            {[...Array(4)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="70%" height={24} />
              </Box>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export const TimelineSkeleton = () => (
  <Box>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Skeleton variant="text" width="30%" height={40} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </Box>
    </Box>

    {/* Calendar Grid */}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
      {[...Array(7)].map((_, index) => (
        <Skeleton key={index} variant="text" height={32} />
      ))}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
      {[...Array(35)].map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={80} />
      ))}
    </Box>
  </Box>
);

export const SkeletonLoader = ({ type, ...props }) => {
  switch (type) {
    case 'table':
      return <TableSkeleton {...props} />;
    case 'card':
      return <CardSkeleton {...props} />;
    case 'dashboard':
      return <DashboardSkeleton {...props} />;
    case 'hierarchy':
      return <HierarchySkeleton {...props} />;
    case 'chart':
      return <ChartSkeleton {...props} />;
    case 'detail':
      return <DetailPageSkeleton {...props} />;
    case 'timeline':
      return <TimelineSkeleton {...props} />;
    default:
      return <TableSkeleton {...props} />;
  }
};

const skeletonLoaders = {
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  HierarchySkeleton,
  ChartSkeleton,
  DetailPageSkeleton,
  TimelineSkeleton,
  SkeletonLoader
};

export default skeletonLoaders;
