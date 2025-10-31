import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartWidgetProps {
  title: string
  type: 'line' | 'area' | 'bar' | 'pie'
  data: any[]
  dataKey?: string
  xAxisKey?: string
  height?: number
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ChartWidget({ title, type, data, dataKey = 'value', xAxisKey = 'name', height = 300 }: ChartWidgetProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={dataKey} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
          </AreaChart>
        )
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill="#0ea5e9" />
          </BarChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
