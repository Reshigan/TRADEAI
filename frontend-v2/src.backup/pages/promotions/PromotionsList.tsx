import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePromotions } from '@/hooks/usePromotions';
import { DataTable } from '@/components/DataTable/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export const PromotionsList: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = usePromotions();

  const statusColors: Record<string, any> = {
    draft: 'default',
    planned: 'info',
    active: 'success',
    completed: 'default',
    cancelled: 'danger',
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <Badge variant={statusColors[value]}>{value}</Badge>,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (value: number) => formatCurrency(value || 0),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600 mt-1">Manage your promotional campaigns</p>
        </div>
        <Button onClick={() => navigate('/promotions/create')}>
          <Plus size={20} className="mr-2" />
          Create Promotion
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        onRowClick={(promo) => navigate(`/promotions/${promo._id}`)}
        isLoading={isLoading}
      />
    </div>
  );
};
