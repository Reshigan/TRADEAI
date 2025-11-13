import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Area,
  ComposedChart,
} from 'recharts';

interface DataPoint {
  [key: string]: any;
}

interface LineConfig {
  dataKey: string;
  name?: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean;
  activeDot?: boolean;
}

interface AdvancedLineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;
  showArea?: boolean;
  onDataPointClick?: (data: any) => void;
}

const colors = [
  '#2563eb', '#7c3aed', '#ea580c', '#16a34a', '#dc2626',
  '#0891b2', '#c026d3', '#ca8a04', '#4f46e5', '#db2777',
];

export const AdvancedLineChart: React.FC<AdvancedLineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 400,
  showGrid = true,
  showLegend = true,
  showBrush = false,
  showArea = false,
  onDataPointClick,
}) => {
  const ChartComponent = showArea ? ComposedChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        onClick={onDataPointClick}
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
        />
        {showLegend && <Legend />}
        {showBrush && (
          <Brush
            dataKey={xAxisKey}
            height={30}
            stroke="#2563eb"
            fill="#eff6ff"
          />
        )}
        {lines.map((line, index) => {
          const color = line.stroke || colors[index % colors.length];
          return showArea ? (
            <React.Fragment key={line.dataKey}>
              <Area
                type="monotone"
                dataKey={line.dataKey}
                fill={color}
                fillOpacity={0.1}
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey={line.dataKey}
                name={line.name || line.dataKey}
                stroke={color}
                strokeWidth={line.strokeWidth || 2}
                dot={line.dot !== false ? { fill: color, r: 4 } : false}
                activeDot={
                  line.activeDot !== false
                    ? { r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }
                    : false
                }
              />
            </React.Fragment>
          ) : (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={color}
              strokeWidth={line.strokeWidth || 2}
              dot={line.dot !== false ? { fill: color, r: 4 } : false}
              activeDot={
                line.activeDot !== false
                  ? { r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }
                  : false
              }
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
};
