import { useState } from 'react';
import { Calculator, DollarSign } from 'lucide-react';
import { useCalculateRebate } from '../../hooks/useRebates';

interface RebateCalculatorProps {
  rebateId: string;
  rebatePercentage?: number;
  rebateName: string;
}

export default function RebateCalculator({
  rebateId,
  rebatePercentage = 0,
  rebateName,
}: RebateCalculatorProps) {
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const calculateRebate = useCalculateRebate();

  const calculation = calculateRebate.data?.data;

  const handleCalculate = () => {
    if (baseAmount > 0) {
      calculateRebate.mutate({ rebateId, baseAmount });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Calculator className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Rebate Calculator</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-indigo-900">Rebate Program</p>
              <p className="text-lg font-bold text-indigo-600">{rebateName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-indigo-900">Rate</p>
              <p className="text-2xl font-bold text-indigo-600">{rebatePercentage}%</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Amount ($)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              placeholder="Enter base amount"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={baseAmount <= 0 || calculateRebate.isPending}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {calculateRebate.isPending ? 'Calculating...' : 'Calculate Rebate'}
        </button>

        {calculation && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Calculation Results</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">${calculation.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rebate Rate:</span>
                <span className="font-medium">{calculation.rebatePercentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rebate Amount:</span>
                <span className="font-medium text-green-600">
                  ${calculation.rebateAmount.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Rebate:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${calculation.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
