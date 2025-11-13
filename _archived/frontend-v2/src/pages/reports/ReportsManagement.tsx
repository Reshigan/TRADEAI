import { useState } from 'react';
import { Plus, Play, Calendar, Download, FileText } from 'lucide-react';

export default function ReportsManagement() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Mock data
  const reports = [
    {
      id: '1',
      name: 'Monthly Sales Report',
      type: 'sales',
      schedule: 'monthly',
      lastRun: '2025-10-01T00:00:00Z',
      nextRun: '2025-11-01T00:00:00Z',
      status: 'active',
    },
    {
      id: '2',
      name: 'Customer Performance',
      type: 'performance',
      schedule: 'weekly',
      lastRun: '2025-10-20T00:00:00Z',
      nextRun: '2025-10-27T00:00:00Z',
      status: 'active',
    },
    {
      id: '3',
      name: 'Inventory Summary',
      type: 'inventory',
      schedule: 'daily',
      lastRun: '2025-10-26T00:00:00Z',
      nextRun: '2025-10-27T00:00:00Z',
      status: 'active',
    },
  ];

  const recentExecutions = [
    {
      id: '1',
      reportName: 'Monthly Sales Report',
      executedAt: '2025-10-01T08:00:00Z',
      status: 'completed',
      fileSize: 2.5,
      duration: 12,
    },
    {
      id: '2',
      reportName: 'Customer Performance',
      executedAt: '2025-10-20T09:00:00Z',
      status: 'completed',
      fileSize: 1.8,
      duration: 8,
    },
    {
      id: '3',
      reportName: 'Inventory Summary',
      executedAt: '2025-10-26T07:00:00Z',
      status: 'completed',
      fileSize: 0.9,
      duration: 5,
    },
  ];

  const handleRunReport = (reportId: string) => {
    console.log('Running report:', reportId);
  };

  const handleDownload = (executionId: string) => {
    console.log('Downloading:', executionId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-500 mt-1">Create, schedule, and manage reports</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Reports</p>
          <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Active Schedules</p>
          <p className="text-3xl font-bold text-green-600">
            {reports.filter((r) => r.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Executions (30d)</p>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Storage Used</p>
          <p className="text-3xl font-bold text-gray-900">45.2 MB</p>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {report.schedule}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(report.lastRun).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(report.nextRun).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRunReport(report.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Run Now"
                    >
                      <Play className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Executions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Executed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentExecutions.map((execution) => (
                <tr key={execution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {execution.reportName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(execution.executedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {execution.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {execution.duration}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {execution.fileSize} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDownload(execution.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
