import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

export interface FlowStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  validate?: () => Promise<boolean> | boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

interface FlowContainerProps {
  steps: FlowStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onSaveDraft?: () => void;
  showSaveDraft?: boolean;
  canGoBack?: boolean;
  canGoNext?: boolean;
  loading?: boolean;
}

export const FlowContainer: React.FC<FlowContainerProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSaveDraft,
  showSaveDraft = true,
  canGoBack = true,
  canGoNext = true,
  loading = false,
}) => {
  const [validating, setValidating] = useState(false);

  const handleNext = async () => {
    const step = steps[currentStep];
    
    if (step.validate) {
      setValidating(true);
      try {
        const isValid = await step.validate();
        if (!isValid) {
          setValidating(false);
          return;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidating(false);
        return;
      }
      setValidating(false);
    }

    if (step.onExit) {
      step.onExit();
    }

    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      if (steps[nextStep].onEnter) {
        steps[nextStep].onEnter!();
      }
      onStepChange(nextStep);
    }
  };

  const handleBack = () => {
    const step = steps[currentStep];
    if (step.onExit) {
      step.onExit();
    }

    const prevStep = currentStep - 1;
    if (steps[prevStep].onEnter) {
      steps[prevStep].onEnter!();
    }
    onStepChange(prevStep);
  };

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <p
                  className={`text-xs mt-2 font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
            {currentStepData.description && (
              <p className="text-gray-600 mt-1">{currentStepData.description}</p>
            )}
          </div>

          <div className="py-6">{currentStepData.component}</div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {!isFirstStep && canGoBack && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading || validating}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSaveDraft && onSaveDraft && (
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={loading || validating}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Draft
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={!canGoNext || loading || validating}
            className="flex items-center gap-2"
          >
            {validating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Validating...
              </>
            ) : isLastStep ? (
              <>Complete</>
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
