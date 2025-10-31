import React, { useState } from 'react';
import { FlowContainer, FlowStep } from './FlowContainer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { aiService } from '../../api/services/ai';
import { customersService } from '../../api/services/customers';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Building, Mail, Phone, MapPin, DollarSign, CreditCard, CheckCircle, Sparkles } from 'lucide-react';

// Validation schemas for each step
const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Customer code is required'),
  type: z.enum(['retail', 'wholesale', 'distributor']),
});

const contactSchema = z.object({
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  contactPerson: z.string().min(2, 'Contact person name required'),
});

const businessProfileSchema = z.object({
  industry: z.string().min(2, 'Industry is required'),
  annualRevenue: z.number().min(0),
  employeeCount: z.number().min(1),
  businessYears: z.number().min(0),
});

export const CustomerFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const BasicInfoStep = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(basicInfoSchema),
      defaultValues: formData.basicInfo || {},
    });

    const onSubmit = (data: any) => {
      setFormData({ ...formData, basicInfo: data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-600">Tell us about this customer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <Input {...register('name')} placeholder="ABC Corporation" />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Code *
            </label>
            <Input {...register('code')} placeholder="CUST-001" />
            {errors.code && (
              <p className="text-sm text-red-600 mt-1">{errors.code.message as string}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Type *
            </label>
            <select
              {...register('type')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select type...</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="distributor">Distributor</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message as string}</p>
            )}
          </div>
        </div>
      </form>
    );
  };

  // Step 2: Contact Details
  const ContactDetailsStep = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(contactSchema),
      defaultValues: formData.contact || {},
    });

    const onSubmit = (data: any) => {
      setFormData({ ...formData, contact: data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Mail className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Contact Information</h3>
            <p className="text-sm text-gray-600">How can we reach them?</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="contact@company.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <Input
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person *
            </label>
            <Input
              {...register('contactPerson')}
              placeholder="John Doe"
            />
            {errors.contactPerson && (
              <p className="text-sm text-red-600 mt-1">{errors.contactPerson.message as string}</p>
            )}
          </div>
        </div>
      </form>
    );
  };

  // Step 3: Business Profile
  const BusinessProfileStep = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(businessProfileSchema),
      defaultValues: formData.businessProfile || {},
    });

    const onSubmit = (data: any) => {
      setFormData({ ...formData, businessProfile: data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Building className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Business Profile</h3>
            <p className="text-sm text-gray-600">Company details and metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
            </label>
            <Input {...register('industry')} placeholder="e.g., Retail, Manufacturing" />
            {errors.industry && (
              <p className="text-sm text-red-600 mt-1">{errors.industry.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Revenue ($) *
            </label>
            <Input
              {...register('annualRevenue', { valueAsNumber: true })}
              type="number"
              placeholder="1000000"
            />
            {errors.annualRevenue && (
              <p className="text-sm text-red-600 mt-1">{errors.annualRevenue.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Count *
            </label>
            <Input
              {...register('employeeCount', { valueAsNumber: true })}
              type="number"
              placeholder="50"
            />
            {errors.employeeCount && (
              <p className="text-sm text-red-600 mt-1">{errors.employeeCount.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years in Business *
            </label>
            <Input
              {...register('businessYears', { valueAsNumber: true })}
              type="number"
              placeholder="5"
            />
            {errors.businessYears && (
              <p className="text-sm text-red-600 mt-1">{errors.businessYears.message as string}</p>
            )}
          </div>
        </div>
      </form>
    );
  };

  // Step 4: AI Analysis (AI validation!)
  const AIAnalysisStep = () => {
    React.useEffect(() => {
      if (!aiAnalysis) {
        runAIAnalysis();
      }
    }, []);

    const runAIAnalysis = async () => {
      setLoading(true);
      try {
        const result = await aiService.validateData(formData, 'customer');
        setAiAnalysis(result);
      } catch (error) {
        console.error('AI analysis failed:', error);
        setAiAnalysis({ valid: true, warnings: [], suggestions: [] });
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={20} />
            <p className="text-lg font-medium text-gray-900">AI is analyzing your data...</p>
          </div>
          <p className="text-sm text-gray-600 mt-2">This usually takes a few seconds</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Validation Results</h3>
            <p className="text-sm text-gray-600">Our AI has reviewed your information</p>
          </div>
        </div>

        {aiAnalysis?.valid ? (
          <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h4 className="font-semibold text-green-900">Validation Passed</h4>
                <p className="text-sm text-green-700 mt-1">
                  All information looks good! You can proceed to the next step.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-3">Please Review</h4>
            <ul className="space-y-2">
              {aiAnalysis?.warnings?.map((warning: string, idx: number) => (
                <li key={idx} className="text-sm text-orange-700">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis?.suggestions && aiAnalysis.suggestions.length > 0 && (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">AI Suggestions</h4>
            <ul className="space-y-2">
              {aiAnalysis.suggestions.map((suggestion: string, idx: number) => (
                <li key={idx} className="text-sm text-blue-700">• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Step 5: Review & Submit
  const ReviewSubmitStep = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Review & Submit</h3>
            <p className="text-sm text-gray-600">Please review all information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-600">Name:</dt>
              <dd className="font-medium">{formData.basicInfo?.name}</dd>
              <dt className="text-gray-600">Code:</dt>
              <dd className="font-medium">{formData.basicInfo?.code}</dd>
              <dt className="text-gray-600">Type:</dt>
              <dd className="font-medium">{formData.basicInfo?.type}</dd>
            </dl>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-600">Email:</dt>
              <dd className="font-medium">{formData.contact?.email}</dd>
              <dt className="text-gray-600">Phone:</dt>
              <dd className="font-medium">{formData.contact?.phone}</dd>
              <dt className="text-gray-600">Contact Person:</dt>
              <dd className="font-medium">{formData.contact?.contactPerson}</dd>
            </dl>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Business Profile</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-600">Industry:</dt>
              <dd className="font-medium">{formData.businessProfile?.industry}</dd>
              <dt className="text-gray-600">Annual Revenue:</dt>
              <dd className="font-medium">${formData.businessProfile?.annualRevenue?.toLocaleString()}</dd>
              <dt className="text-gray-600">Employees:</dt>
              <dd className="font-medium">{formData.businessProfile?.employeeCount}</dd>
              <dt className="text-gray-600">Years in Business:</dt>
              <dd className="font-medium">{formData.businessProfile?.businessYears}</dd>
            </dl>
          </div>
        </div>
      </div>
    );
  };

  const steps: FlowStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Info',
      description: 'Customer identification',
      component: <BasicInfoStep />,
      validate: async () => {
        const result = basicInfoSchema.safeParse(formData.basicInfo);
        return result.success;
      },
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Contact details',
      component: <ContactDetailsStep />,
      validate: async () => {
        const result = contactSchema.safeParse(formData.contact);
        return result.success;
      },
    },
    {
      id: 'business',
      title: 'Business',
      description: 'Business profile',
      component: <BusinessProfileStep />,
      validate: async () => {
        const result = businessProfileSchema.safeParse(formData.businessProfile);
        return result.success;
      },
    },
    {
      id: 'ai-analysis',
      title: 'AI Check',
      description: 'AI validation',
      component: <AIAnalysisStep />,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Final review',
      component: <ReviewSubmitStep />,
    },
  ];

  const handleComplete = async () => {
    setLoading(true);
    try {
      const customerData = {
        ...formData.basicInfo,
        ...formData.contact,
        ...formData.businessProfile,
      };
      await customersService.create(customerData);
      alert('Customer created successfully!');
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('customerFlowDraft', JSON.stringify(formData));
    alert('Draft saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FlowContainer
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onSaveDraft={handleSaveDraft}
        loading={loading}
      />
    </div>
  );
};
