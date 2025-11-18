import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { DataTable } from '../../components/DataTable/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus } from 'lucide-react';

export const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useCustomers();

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value}
        </Badge>
      ),
    },
    { key: 'contactEmail', label: 'Email' },
    { key: 'contactPhone', label: 'Phone' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <Button onClick={() => navigate('/customers/create')}>
          <Plus size={20} className="mr-2" />
          Add Customer
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        onRowClick={(customer) => navigate(`/customers/${customer._id}`)}
        isLoading={isLoading}
      />
    </div>
  );
};
