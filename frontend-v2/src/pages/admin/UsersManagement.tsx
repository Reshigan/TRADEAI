import { useState } from 'react';
import { Plus, UserCheck, UserX, Key } from 'lucide-react';
import {
  useUsers,
  useDeleteUser,
  useActivateUser,
  useDeactivateUser,
  useResetPassword,
} from '../../hooks/useAdmin';
import { DataTable } from '../../components/DataTable/DataTable';
import { User } from '../../api/services/admin';

export default function UsersManagement() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<string>('');

  const { data: usersData, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();

  const users = usersData?.data || [];

  const columns = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: (row: User) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (row: User) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      cell: (row: User) => (
        <div className="text-sm text-gray-600">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: (row: User) => (
        <div className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser.mutateAsync(id);
    }
  };

  const handleActivate = async (id: string) => {
    await activateUser.mutateAsync(id);
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      await deactivateUser.mutateAsync(id);
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const result = await resetPassword.mutateAsync(id);
      setTempPassword(result.data.temporaryPassword);
      setShowResetModal(true);
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const customActions = (row: User) => (
    <div className="flex space-x-2">
      {row.status === 'active' ? (
        <button
          onClick={() => handleDeactivate(row._id)}
          className="text-red-600 hover:text-red-900"
          title="Deactivate"
        >
          <UserX className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => handleActivate(row._id)}
          className="text-green-600 hover:text-green-900"
          title="Activate"
        >
          <UserCheck className="h-5 w-5" />
        </button>
      )}
      <button
        onClick={() => handleResetPassword(row._id)}
        className="text-blue-600 hover:text-blue-900"
        title="Reset Password"
      >
        <Key className="h-5 w-5" />
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading users. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and their access</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Active Users</p>
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Inactive Users</p>
          <p className="text-3xl font-bold text-gray-600">
            {users.filter((u) => u.status === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={users}
          columns={columns}
          loading={isLoading}
          onDelete={handleDelete}
          customActions={customActions}
        />
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Reset</h3>
            <p className="text-gray-600 mb-4">
              Temporary password has been generated. Please share this with the user securely.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <code className="text-lg font-mono">{tempPassword}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                setShowResetModal(false);
              }}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
