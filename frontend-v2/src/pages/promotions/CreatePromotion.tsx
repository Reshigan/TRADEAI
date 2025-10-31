import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper, StepperActions, Step } from '../../components/ui/Stepper';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useCreatePromotion } from '../../hooks/usePromotions';

const steps: Step[] = [
  { id: 'basic', title: 'Basic Info', description: 'Name and type' },
  { id: 'customers', title: 'Customers', description: 'Select customers' },
  { id: 'products', title: 'Products', description: 'Select products' },
  { id: 'budget', title: 'Budget & Dates', description: 'Set budget and timeline' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

export const CreatePromotion: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: 'seasonal',
    description: '',
    customers: [],
    products: [],
    budget: 0,
    startDate: '',
    endDate: '',
  });

  const navigate = useNavigate();
  const createMutation = useCreatePromotion();

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      navigate('/promotions');
    } catch (error) {
      console.error('Failed to create promotion:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Promotion Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Sale 2025"
            />
            <Select
              label="Promotion Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'seasonal', label: 'Seasonal' },
                { value: 'volume', label: 'Volume Discount' },
                { value: 'bogo', label: 'Buy One Get One' },
                { value: 'discount', label: 'Percentage Discount' },
              ]}
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>
        );
      case 1:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Customer selection interface</p>
            <p className="text-sm text-gray-400 mt-2">Multi-select with search</p>
          </div>
        );
      case 2:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Product selection interface</p>
            <p className="text-sm text-gray-400 mt-2">Multi-select with filters</p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Input
              label="Budget (ZAR)"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            />
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Promotion</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Name:</dt>
                <dd className="font-medium">{formData.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium">{formData.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Budget:</dt>
                <dd className="font-medium">R {formData.budget.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Promotion</h1>
        <p className="text-gray-600 mt-1">Follow the steps to create a new promotion</p>
      </div>

      <Card>
        <CardContent>
          <Stepper steps={steps} currentStep={currentStep} />
          
          <div className="mt-8">
            {renderStep()}
          </div>

          <StepperActions
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            canGoNext={currentStep === 0 ? !!formData.name : true}
          />
        </CardContent>
      </Card>
    </div>
  );
};
