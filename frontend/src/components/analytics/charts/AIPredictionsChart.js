import React from 'react';
import { Box, useTheme } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area
} from 'recharts';

// No more mock data - using real API calls

const AIPredictionsChart = ({ data = [], height = 400 }) => {
  const theme = useTheme();

  // Format currency for tooltip
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Find the index where predictions start
  const predictionStartIndex = data.findIndex(item => item && item.isPrediction);
  const hasPredictions = predictionStartIndex > 0 && predictionStartIndex < data.length;
  const hasValidData = data && data.length > 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {data.actual !== null && data.actual !== undefined && (
            <p style={{ margin: '5px 0', color: theme.palette.primary.main }}>
              Actual: {formatCurrency(data.actual)}
            </p>
          )}
          {data.predicted !== null && data.predicted !== undefined && (
            <p style={{ margin: '5px 0', color: theme.palette.secondary.main }}>
              Predicted: {formatCurrency(data.predicted)}
            </p>
          )}
          {data.isPrediction && (
            <>
              <p style={{ margin: '5px 0', color: theme.palette.grey[600] }}>
                Lower Bound: {formatCurrency(data.lower)}
              </p>
              <p style={{ margin: '5px 0', color: theme.palette.grey[600] }}>
                Upper Bound: {formatCurrency(data.upper)}
              </p>
            </>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Prediction area - only render if we have valid predictions */}
          {hasPredictions && hasValidData && data[predictionStartIndex - 1] && data[data.length - 1] && (
            <ReferenceArea 
              x1={data[predictionStartIndex - 1].month} 
              x2={data[data.length - 1].month} 
              fill={theme.palette.grey[100]} 
              fillOpacity={0.5} 
            />
          )}
          
          {/* Reference line for current month - only render if we have valid predictions */}
          {hasPredictions && hasValidData && data[predictionStartIndex - 1] && (
            <ReferenceLine 
              x={data[predictionStartIndex - 1].month} 
              stroke={theme.palette.grey[500]} 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Current', 
                position: 'insideTopRight',
                fill: theme.palette.grey[700],
                fontSize: 12
              }} 
            />
          )}
          
          {/* Actual sales line */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Actual Sales" 
            stroke={theme.palette.primary.main} 
            strokeWidth={2} 
            dot={{ r: 5 }} 
            activeDot={{ r: 8 }} 
          />
          
          {/* Predicted sales line */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            name="Predicted Sales" 
            stroke={theme.palette.secondary.main} 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 5 }} 
            activeDot={{ r: 8 }} 
          />
          
          {/* Confidence interval area */}
          <Area 
            type="monotone" 
            dataKey="upper" 
            stroke="none" 
            fill={theme.palette.secondary.light} 
            fillOpacity={0.2} 
          />
          <Area 
            type="monotone" 
            dataKey="lower" 
            stroke="none" 
            fill={theme.palette.secondary.light} 
            fillOpacity={0.2} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AIPredictionsChart;