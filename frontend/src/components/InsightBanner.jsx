import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Collapse } from 'react-bootstrap';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import apiClient from '../services/apiClient';

const InsightBanner = ({ module, entityId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInsights, setExpandedInsights] = useState(new Set());

  useEffect(() => {
    if (module && entityId) {
      loadInsights();
    }
  }, [module, entityId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/insights', {
        params: {
          module,
          status: 'new,acknowledged,in_progress',
          limit: 5
        }
      });

      if (response.data.success) {
        setInsights(response.data.data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationTriangle className="text-danger" />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" />;
      case 'success':
        return <FaCheckCircle className="text-success" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  const handleAcknowledge = async (insightId) => {
    try {
      await apiClient.post(`/insights/${insightId}/acknowledge`);
      loadInsights();
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  const handleDismiss = async (insightId) => {
    try {
      await apiClient.post(`/insights/${insightId}/dismiss`, {
        notes: 'Dismissed from banner'
      });
      loadInsights();
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const toggleExpanded = (insightId) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  if (loading) {
    return null;
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="insight-banner mb-3">
      {insights.map((insight) => (
        <Alert
          key={insight._id}
          variant={getSeverityVariant(insight.severity)}
          className="mb-2"
          dismissible={false}
        >
          <div className="d-flex align-items-start">
            <div className="me-2 mt-1">
              {getSeverityIcon(insight.severity)}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{insight.title}</strong>
                  <Badge bg="secondary" className="ms-2">
                    {insight.category}
                  </Badge>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => toggleExpanded(insight._id)}
                  >
                    {expandedInsights.has(insight._id) ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleDismiss(insight._id)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              </div>
              <p className="mb-1 mt-1">{insight.description}</p>
              
              <Collapse in={expandedInsights.has(insight._id)}>
                <div>
                  {insight.recommendedActions && insight.recommendedActions.length > 0 && (
                    <div className="mt-2">
                      <strong>Recommended Actions:</strong>
                      <ul className="mb-2">
                        {insight.recommendedActions.map((action, idx) => (
                          <li key={idx}>
                            <Badge bg={action.priority === 'critical' || action.priority === 'high' ? 'danger' : 'secondary'}>
                              {action.priority}
                            </Badge>{' '}
                            {action.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.status === 'new' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAcknowledge(insight._id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Collapse>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default InsightBanner;
