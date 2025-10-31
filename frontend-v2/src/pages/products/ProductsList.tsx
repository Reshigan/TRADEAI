import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { DataTable } from '../../components/DataTable/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useProducts();

  const columns = [
    { key: 'name', label: 'Product', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'brand', label: 'Brand', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => navigate('/products/create')}>
          <Plus size={20} className="mr-2" />
          Add Product
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        onRowClick={(product) => navigate(`/products/${product._id}`)}
        isLoading={isLoading}
      />
    </div>
  );
};
