import { Users, Shield, Activity, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useSystemHealth, useUserStats, useActivityStats } from '../../hooks/useAdmin';
import { Link } from 'router-dom';

export default function AdminDashboard() {
  const { data: healthData } = useSystemHealth();
  const { data: userStatsData } = useUserStats();
  const { data: activityData } = useActivityStats('week');

  const health = healthData?.data;
  const userStats = userStatsData?.data;
  const activity = activityData?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and management</p>
      </div>

      {/* System Health Status */}
      {health && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
            <div className="flex items-center">
              {health.status === 'healthy' ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <AlertCircle className={`h-6 w-6 ${getStatusColor(health.status)} mr-2`} />
              )}
              <span className={`text-lg font-semibold ${getStatusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((health.memory.used / health.memory.total) * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                {Math.round(health.memory.used / 1024 / 1024)} MB / {Math.round(health.memory.total / 1024 / 1024)} MB
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(health.cpu)}%</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Database</p>
              <p className={`text-2xl font-bold ${getStatusColor(health.database.status)}`}>
                {health.database.status}
              </p>
              <p className="text-xs text-gray-500">{health.database.latency}ms latency</p>
            </div>
          </div>

          {/* Services Status */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {health.services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{service.name}</span>
                  <span className={`text-xs font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{userStats.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  {userStats.active} active
                </p>
              </div>
              <Users className="h-12 w-12 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roles</p>
                <p className="text-3xl font-bold text-gray-900">{userStats.roles || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {userStats.permissions || 0} permissions
                </p>
              </div>
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activity Today</p>
                <p className="text-3xl font-bold text-gray-900">{activity?.today || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {activity?.online || 0} online now
                </p>
              </div>
              <Activity className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System</p>
                <p className="text-3xl font-bold text-gray-900">
                  {health?.status === 'healthy' ? 'OK' : 'Check'}
                </p>
                <p className="text-sm text-gray-500 mt-1">All services</p>
              </div>
              <Settings className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          </div>
          <p className="text-gray-600">
            Manage users, roles, and permissions
          </p>
        </Link>

        <Link
          to="/admin/roles"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Roles & Permissions</h3>
          </div>
          <p className="text-gray-600">
            Configure roles and access control
          </p>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
          </div>
          <p className="text-gray-600">
            Configure system preferences
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      {activity && activity.recent && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity.recent.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
