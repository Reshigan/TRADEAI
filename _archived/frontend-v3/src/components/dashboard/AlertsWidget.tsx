import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
}

interface AlertsWidgetProps {
  alerts: Alert[]
}

export default function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="text-red-500" size={20} />
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />
      case 'info': return <Info className="text-blue-500" size={20} />
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      default: return <Info className="text-gray-500" size={20} />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'info': return 'bg-blue-50 border-blue-200'
      case 'success': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No alerts</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 border rounded-md ${getAlertBg(alert.type)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
