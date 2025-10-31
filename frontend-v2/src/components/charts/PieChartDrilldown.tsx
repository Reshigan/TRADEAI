import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '../ui/Button';
import { ChevronLeft } from 'lucide-react';

interface DataPoint {
  name: string;
  value: number;
  children?: DataPoint[];
  fill?: string;
}

interface PieChartDrilldownProps {
  data: DataPoint[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = [
  '#2563eb', '#7c3aed', '#ea580c', '#16a34a', '#dc2626',
  '#0891b2', '#c026d3', '#ca8a04', '#4f46e5', '#db2777',
];

export const PieChartDrilldown: React.FC<PieChartDrilldownProps> = ({
  data,
  height = 400,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 120,
}) => {
  const [currentData, setCurrentData] = useState<DataPoint[]>(data);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  const handlePieClick = (entry: any) => {
    if (entry.children && entry.children.length > 0) {
      setCurrentData(entry.children);
      setBreadcrumb([...breadcrumb, entry.name]);
    }
  };

  const handleBack = () => {
    if (breadcrumb.length === 0) return;

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    // Navigate back through the data structure
    let newData = data;
    for (const crumb of newBreadcrumb) {
      const parent = newData.find((d) => d.name === crumb);
      if (parent && parent.children) {
        newData = parent.children;
      }
    }
    setCurrentData(newData);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-medium">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percent?.toFixed(1)}%</span>
          </p>
          {data.payload.children && (
            <p className="text-xs text-blue-600 mt-1">Click to drill down</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {breadcrumb.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Back
          </Button>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>Home</span>
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                <span className="mx-1">/</span>
                <span className="font-medium text-gray-900">{crumb}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={currentData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            onClick={handlePieClick}
            cursor="pointer"
          >
            {currentData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
