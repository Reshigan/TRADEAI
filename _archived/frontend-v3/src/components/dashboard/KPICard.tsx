import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

export default function KPICard({ title, value, change, trend = 'neutral', icon }: KPICardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} />
    if (trend === 'down') return <TrendingDown size={16} />
    return <Minus size={16} />
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {change !== undefined && (
        <div className={`flex items-center text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">{Math.abs(change)}%</span>
          <span className="ml-1 text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  )
}
