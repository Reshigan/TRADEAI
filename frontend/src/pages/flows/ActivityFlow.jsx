import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PromotionFlow.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ActivityFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    activityName: '',
    activityType: 'In-Store Promotion',
    customer: '',
    customerName: '',
    description: '',
    objectives: '',
    
    // Step 2: Timeline
    startDate: '',
    endDate: '',
    
    // Step 3: Budget
    budgetAllocated: '',
    
    // Step 4: Location
    locationCity: '',
    locationState: '',
    stores: [''],
    
    // Step 5: Team
    owner: '',
    team: [''],
    
    // Step 6: Expected Outcomes
    volumeIncrease: '',
    revenueTarget: '',
    roi: '',
    
    // Step 7: Milestones
    milestones: [{ name: '', dueDate: '', completed: false }]
  });

  const activityTypes = [
    'In-Store Promotion',
    'Display',
    'Sampling',
    'Demo',
    'Trade Show',
    'Training',
    'Joint Business Planning',
    'Price Promotion',
    'Volume Incentive',
    'Other'
  ];

  const steps = [
    { number: 1, title: 'Basic Information', icon: '📋' },
    { number: 2, title: 'Timeline', icon: '📅' },
    { number: 3, title: 'Budget', icon: '💰' },
    { number: 4, title: 'Location', icon: '📍' },
    { number: 5, title: 'Team', icon: '👥' },
    { number: 6, title: 'Expected Outcomes', icon: '🎯' },
    { number: 7, title: 'Milestones & Review', icon: '✅' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleArrayInputChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', dueDate: '', completed: false }]
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.activityName.trim()) {
          setError('Activity name is required');
          return false;
        }
        if (!formData.customerName.trim()) {
          setError('Customer name is required');
          return false;
        }
        break;
      case 2:
        if (!formData.startDate) {
          setError('Start date is required');
          return false;
        }
        if (!formData.endDate) {
          setError('End date is required');
          return false;
        }
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
          setError('End date must be after start date');
          return false;
        }
        break;
      case 3:
        if (!formData.budgetAllocated || parseFloat(formData.budgetAllocated) <= 0) {
          setError('Valid budget allocation is required');
          return false;
        }
        break;
      case 4:
        if (!formData.locationCity.trim() || !formData.locationState.trim()) {
          setError('Location city and state are required');
          return false;
        }
        break;
      case 5:
        if (!formData.owner.trim()) {
          setError('Activity owner is required');
          return false;
        }
        break;
      case 6:
        // Optional validation for expected outcomes
        break;
      case 7:
        // Optional validation for milestones
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare activity data
      const activityData = {
        activityId: `ACT-${Date.now()}`,
        activityName: formData.activityName,
        activityType: formData.activityType,
        customer: formData.customer || undefined,
        customerName: formData.customerName,
        description: formData.description,
        objectives: formData.objectives,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: {
          allocated: parseFloat(formData.budgetAllocated),
          spent: 0
        },
        location: {
          city: formData.locationCity,
          state: formData.locationState,
          stores: formData.stores.filter(s => s.trim())
        },
        owner: formData.owner,
        team: formData.team.filter(t => t.trim()),
        expectedOutcome: {
          volumeIncrease: parseFloat(formData.volumeIncrease) || undefined,
          revenueTarget: parseFloat(formData.revenueTarget) || undefined,
          roi: parseFloat(formData.roi) || undefined
        },
        milestones: formData.milestones
          .filter(m => m.name.trim())
          .map(m => ({
            name: m.name,
            dueDate: m.dueDate || undefined,
            completed: m.completed
          })),
        status: 'Planned',
        performance: 'Not Started'
      };

      const response = await axios.post(`${API_BASE_URL}/activities`, activityData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        navigate('/activities', { state: { message: 'Activity created successfully!' } });
      }
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.response?.data?.message || 'Failed to create activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>📋 Basic Information</h2>
            
            <div className="form-group">
              <label>Activity Name *</label>
              <input
                type="text"
                name="activityName"
                value={formData.activityName}
                onChange={handleInputChange}
                placeholder="e.g., Summer Product Launch Campaign"
                required
              />
            </div>

            <div className="form-group">
              <label>Activity Type *</label>
              <select
                name="activityType"
                value={formData.activityType}
                onChange={handleInputChange}
                required
              >
                {activityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the activity..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Objectives</label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                placeholder="What are the objectives of this activity?"
                rows="3"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>📅 Timeline</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="info-box">
                <p>Duration: {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>💰 Budget</h2>
            
            <div className="form-group">
              <label>Allocated Budget *</label>
              <input
                type="number"
                name="budgetAllocated"
                value={formData.budgetAllocated}
                onChange={handleInputChange}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
                required
              />
              <small>Currency: ZAR</small>
            </div>

            {formData.budgetAllocated && (
              <div className="info-box">
                <p>Allocated: R {parseFloat(formData.budgetAllocated).toLocaleString()}</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>📍 Location</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleInputChange}
                  placeholder="e.g., Johannesburg"
                  required
                />
              </div>

              <div className="form-group">
                <label>State/Province *</label>
                <input
                  type="text"
                  name="locationState"
                  value={formData.locationState}
                  onChange={handleInputChange}
                  placeholder="e.g., Gauteng"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Stores/Locations</label>
              {formData.stores.map((store, index) => (
                <div key={index} className="array-input-row">
                  <input
                    type="text"
                    value={store}
                    onChange={(e) => handleArrayInputChange(index, 'stores', e.target.value)}
                    placeholder={`Store ${index + 1}`}
                  />
                  {formData.stores.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('stores', index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('stores')} className="add-btn">
                + Add Store
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>👥 Team</h2>
            
            <div className="form-group">
              <label>Activity Owner *</label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                placeholder="Enter owner name"
                required
              />
            </div>

            <div className="form-group">
              <label>Team Members</label>
              {formData.team.map((member, index) => (
                <div key={index} className="array-input-row">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleArrayInputChange(index, 'team', e.target.value)}
                    placeholder={`Team member ${index + 1}`}
                  />
                  {formData.team.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('team', index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('team')} className="add-btn">
                + Add Team Member
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <h2>🎯 Expected Outcomes</h2>
            
            <div className="form-group">
              <label>Volume Increase (%)</label>
              <input
                type="number"
                name="volumeIncrease"
                value={formData.volumeIncrease}
                onChange={handleInputChange}
                placeholder="e.g., 25"
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Revenue Target (ZAR)</label>
              <input
                type="number"
                name="revenueTarget"
                value={formData.revenueTarget}
                onChange={handleInputChange}
                placeholder="e.g., 500000"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Expected ROI</label>
              <input
                type="number"
                name="roi"
                value={formData.roi}
                onChange={handleInputChange}
                placeholder="e.g., 3.5"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="step-content">
            <h2>✅ Milestones</h2>
            
            <div className="form-group">
              <label>Activity Milestones</label>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="milestone-row">
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                    placeholder="Milestone name"
                  />
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                    placeholder="Due date"
                  />
                  {formData.milestones.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeMilestone(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMilestone} className="add-btn">
                + Add Milestone
              </button>
            </div>

            <div className="review-section">
              <h3>Review Summary</h3>
              <div className="review-item">
                <strong>Activity:</strong> {formData.activityName}
              </div>
              <div className="review-item">
                <strong>Type:</strong> {formData.activityType}
              </div>
              <div className="review-item">
                <strong>Customer:</strong> {formData.customerName}
              </div>
              <div className="review-item">
                <strong>Duration:</strong> {formData.startDate} to {formData.endDate}
              </div>
              <div className="review-item">
                <strong>Budget:</strong> R {parseFloat(formData.budgetAllocated || 0).toLocaleString()}
              </div>
              <div className="review-item">
                <strong>Location:</strong> {formData.locationCity}, {formData.locationState}
              </div>
              <div className="review-item">
                <strong>Owner:</strong> {formData.owner}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="promotion-flow-container">
      <div className="flow-header">
        <h1>🎯 Create New Activity</h1>
        <button onClick={() => navigate('/activities')} className="close-btn">✕</button>
      </div>

      <div className="progress-bar">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`progress-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {currentStep > step.number ? '✓' : step.icon}
            </div>
            <div className="step-label">{step.title}</div>
          </div>
        ))}
      </div>

      <div className="flow-content">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {renderStepContent()}

        <div className="flow-actions">
          {currentStep > 1 && (
            <button onClick={handlePrevious} className="btn-secondary">
              ← Previous
            </button>
          )}
          
          {currentStep < steps.length ? (
            <button onClick={handleNext} className="btn-primary">
              Next →
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              className="btn-success"
              disabled={loading}
            >
              {loading ? 'Creating...' : '✓ Create Activity'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFlow;
