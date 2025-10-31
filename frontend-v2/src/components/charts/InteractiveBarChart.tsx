import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataPoint {
  [key: string]: any;
}

interface BarConfig {
  dataKey: string;
  name?: string;
  fill?: string;
  stackId?: string;
}

interface InteractiveBarChartProps {
  data: DataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  clickable?: boolean;
  onBarClick?: (data: any) => void;
  highlightOnHover?: boolean;
}

const colors = [
  '#2563eb', '#7c3aed', '#ea580c', '#16a34a', '#dc2626',
  '#0891b2', '#c026d3', '#ca8a04', '#4f46e5', '#db2777',
];

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 400,
  showGrid = true,
  showLegend = true,
  clickable = true,
  onBarClick,
  highlightOnHover = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleBarClick = (data: any, index: number) => {
    if (clickable && onBarClick) {
      onBarClick(data);
    }
  };

  const handleBarMouseEnter = (data: any, index: number) => {
    if (highlightOnHover) {
      setActiveIndex(index);
    }
  };

  const handleBarMouseLeave = () => {
    if (highlightOnHover) {
      setActiveIndex(null);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
        />
        {showLegend && <Legend />}
        {bars.map((bar, index) => {
          const color = bar.fill || colors[index % colors.length];
          return (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={color}
              stackId={bar.stackId}
              onClick={handleBarClick}
              onMouseEnter={handleBarMouseEnter}
              onMouseLeave={handleBarMouseLeave}
              cursor={clickable ? 'pointer' : 'default'}
              radius={[4, 4, 0, 0]}
            >
              {highlightOnHover &&
                data.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={activeIndex === idx ? '#1e40af' : color}
                    opacity={activeIndex === null || activeIndex === idx ? 1 : 0.6}
                  />
                ))}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
};
