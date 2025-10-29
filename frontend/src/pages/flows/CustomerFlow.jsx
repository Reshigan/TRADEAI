import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlowContainer from '../../components/flows/FlowContainer';
import BasicInfoStep from './customer/steps/BasicInfoStep';
import ContactDetailsStep from './customer/steps/ContactDetailsStep';
import BusinessProfileStep from './customer/steps/BusinessProfileStep';
import PaymentTermsStep from './customer/steps/PaymentTermsStep';
import RebateEligibilityStep from './customer/steps/RebateEligibilityStep';
import AIAnalysisStep from './customer/steps/AIAnalysisStep';
import ReviewSubmitStep from './customer/steps/ReviewSubmitStep';
import api from '../../services/api';

const CustomerFlow = () => {
  const navigate = useNavigate();

  const flowSteps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Enter customer basic details',
      component: BasicInfoStep,
      validation: {
        fields: {
          name: { required: true, minLength: 3 },
          type: { required: true },
          territory: { required: true }
        }
      },
      aiEnabled: true
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'Enter contact information',
      component: ContactDetailsStep,
      validation: {
        fields: {
          email: { required: true, email: true },
          phone: { required: true },
          address: { required: false }
        }
      },
      aiEnabled: true
    },
    {
      id: 'business',
      title: 'Business Profile',
      description: 'Enter business information',
      component: BusinessProfileStep,
      validation: {
        fields: {
          industry: { required: true },
          annualVolume: { required: true, number: true, min: 0 }
        }
      },
      aiEnabled: true
    },
    {
      id: 'payment',
      title: 'Payment Terms',
      description: 'Configure payment terms',
      component: PaymentTermsStep,
      validation: {
        fields: {
          creditLimit: { required: true, number: true, min: 0 },
          paymentDays: { required: true, number: true, min: 0, max: 90 }
        }
      },
      aiEnabled: true
    },
    {
      id: 'rebates',
      title: 'Rebate Eligibility',
      description: 'Select eligible rebate programs',
      component: RebateEligibilityStep,
      optional: true,
      aiEnabled: true
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'AI-powered risk and growth analysis',
      component: AIAnalysisStep,
      aiEnabled: true
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review all information before submitting',
      component: ReviewSubmitStep,
      aiEnabled: false
    }
  ];

  const getAIRecommendations = async ({ step, data, stepData }) => {
    try {
      const response = await api.post('/ai/customer-analysis', {
        step,
        data,
        stepData
      });
      return response.data.recommendations || [];
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      return [];
    }
  };

  const handleComplete = async (data) => {
    try {
      const response = await api.post('/customers', data);
      if (response.data.success) {
        navigate('/customers');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  };

  const handleSave = async (data) => {
    // Save draft to localStorage
    localStorage.setItem('customer_flow_draft', JSON.stringify(data));
  };

  return (
    <FlowContainer
      title="Customer Onboarding"
      description="Create a new customer with AI-powered guidance"
      steps={flowSteps}
      onComplete={handleComplete}
      onSave={handleSave}
      getAIRecommendations={getAIRecommendations}
      aiEnabled={true}
      backUrl="/customers"
    />
  );
};

export default CustomerFlow;
