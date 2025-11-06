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
import { stepValidators } from '../../utils/customerValidation';

const CustomerFlow = () => {
  const navigate = useNavigate();

  const flowSteps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Enter customer basic details',
      component: BasicInfoStep,
      validator: stepValidators[0],
      aiEnabled: true
    },
    {
      id: 'business',
      title: 'Business Profile',
      description: 'Enter business information and performance metrics',
      component: BusinessProfileStep,
      validator: stepValidators[1],
      aiEnabled: true
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'Enter contact information and address',
      component: ContactDetailsStep,
      validator: stepValidators[2],
      aiEnabled: true
    },
    {
      id: 'payment',
      title: 'Payment Terms',
      description: 'Configure payment terms and financial details',
      component: PaymentTermsStep,
      validator: stepValidators[3],
      aiEnabled: true
    },
    {
      id: 'rebates',
      title: 'Rebate Eligibility',
      description: 'Configure rebate programs and trading terms',
      component: RebateEligibilityStep,
      validator: stepValidators[4],
      optional: true,
      aiEnabled: true
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'AI-powered risk assessment and growth analysis',
      component: AIAnalysisStep,
      validator: stepValidators[5],
      aiEnabled: true
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review all information before submitting',
      component: ReviewSubmitStep,
      validator: stepValidators[6],
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
