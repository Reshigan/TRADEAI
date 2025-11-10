import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const ChartWidget = ({ 
  title, 
  type = 'bar', 
  data, 
  height = 300,
  options = {} 
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: false
      }
    },
    ...options
  };

  const renderChart = () => {
    switch (type) {
      case 'doughnut':
        return <Doughnut data={data} options={defaultOptions} />;
      case 'line':
        return <Line data={data} options={defaultOptions} />;
      case 'bar':
      default:
        return <Bar data={data} options={defaultOptions} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height }}>
          {renderChart()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartWidget;
