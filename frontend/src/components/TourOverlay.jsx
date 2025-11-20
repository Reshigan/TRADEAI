import React, { useState, useEffect } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import apiClient from '../services/apiClient';

const TourOverlay = ({ module, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkTourStatus();
  }, [module]);

  const checkTourStatus = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data?.data || response.data?.user || response.data || {};
      
      const completedTours = user.preferences?.completedTours || [];
      if (!completedTours.includes(module)) {
        loadTourSteps();
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const loadTourSteps = () => {
    const tourStepsMap = {
      budget: [
        {
          title: 'Welcome to Budget Management',
          content: 'This module helps you plan, track, and manage your marketing and trade budgets across different periods and categories.',
          selector: null
        },
        {
          title: 'Budget Overview',
          content: 'View your total allocated budget, spent amount, and remaining balance at a glance. Track your budget utilization percentage.',
          selector: '.budget-overview'
        },
        {
          title: 'Budget Allocation',
          content: 'Allocate budgets by customer, product, or category. Set spending limits and approval thresholds.',
          selector: '.budget-allocation'
        },
        {
          title: 'Budget Tracking',
          content: 'Monitor spending in real-time. Get alerts when budgets are running low or exceeded.',
          selector: '.budget-tracking'
        }
      ],
      promotion: [
        {
          title: 'Welcome to Promotion Management',
          content: 'Plan, execute, and analyze trade promotions to drive sales and achieve your business objectives.',
          selector: null
        },
        {
          title: 'Promotion Planning',
          content: 'Create promotion plans with mechanics, pricing, and target customers. Forecast expected sales and ROI.',
          selector: '.promotion-planning'
        },
        {
          title: 'Promotion Execution',
          content: 'Track promotion performance in real-time. Monitor sales lift, incremental volume, and ROI.',
          selector: '.promotion-execution'
        },
        {
          title: 'Promotion Analytics',
          content: 'Analyze promotion effectiveness. Compare actual vs forecast performance and identify optimization opportunities.',
          selector: '.promotion-analytics'
        }
      ],
      claim: [
        {
          title: 'Welcome to Claims Management',
          content: 'Process and track customer claims efficiently. Ensure timely payments and maintain customer satisfaction.',
          selector: null
        },
        {
          title: 'Claim Submission',
          content: 'Submit claims with supporting documentation. Track claim status from submission to payment.',
          selector: '.claim-submission'
        },
        {
          title: 'Claim Validation',
          content: 'Validate claims against promotion terms and conditions. Approve or reject claims with detailed notes.',
          selector: '.claim-validation'
        },
        {
          title: 'Claim Settlement',
          content: 'Process approved claims for payment. Track settlement status and payment dates.',
          selector: '.claim-settlement'
        }
      ],
      default: [
        {
          title: 'Welcome to TRADEAI',
          content: 'Your comprehensive trade promotions management platform. Navigate through different modules to manage your trade spend effectively.',
          selector: null
        },
        {
          title: 'Dashboard Overview',
          content: 'View key metrics, insights, and alerts across all modules. Monitor your overall trade spend performance.',
          selector: '.dashboard-overview'
        },
        {
          title: 'Module Navigation',
          content: 'Access different modules from the sidebar. Each module provides specialized functionality for specific trade management needs.',
          selector: '.sidebar-nav'
        }
      ]
    };

    const steps = tourStepsMap[module] || tourStepsMap.default;
    setTourSteps(steps);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await apiClient.put('/auth/profile', {
        preferences: {
          completedTours: [module]
        }
      });
      setIsOpen(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing tour:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  const handleExplain = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/ollama/chat', {
        model: 'tinyllama',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant explaining trade promotions management concepts. Keep explanations concise and practical.'
          },
          {
            role: 'user',
            content: `Explain this concept in simple terms: ${currentStepData.title}. Context: ${currentStepData.content}`
          }
        ],
        stream: false
      });
      
      if (response.data.success && response.data.data.message) {
        alert(response.data.data.message.content);
      } else {
        alert('Unable to get explanation at this time. Please try again later.');
      }
    } catch (error) {
      console.error('Error getting explanation:', error);
      alert('Unable to get explanation at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || tourSteps.length === 0) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <Modal
      show={isOpen}
      onHide={handleSkip}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title className="d-flex align-items-center">
          <FaQuestionCircle className="me-2 text-primary" />
          {currentStepData.title}
        </Modal.Title>
        <Button variant="link" onClick={handleSkip}>
          <FaTimes />
        </Button>
      </Modal.Header>
      <Modal.Body>
        <ProgressBar now={progress} className="mb-3" />
        <p>{currentStepData.content}</p>
        <div className="text-muted small">
          Step {currentStep + 1} of {tourSteps.length}
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button
            variant="outline-secondary"
            onClick={handleExplain}
            disabled={loading}
          >
            Explain This
          </Button>
        </div>
        <div>
          <Button
            variant="outline-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="me-2"
          >
            <FaArrowLeft /> Previous
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={loading}
          >
            {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'} <FaArrowRight />
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TourOverlay;
