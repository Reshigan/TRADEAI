import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Zap, ChevronRight } from 'lucide-react';

const DecisionCard = ({
  title,
  description,
  impact,
  roi,
  confidence,
  hierarchy,
  risks = [],
  priority = 'medium',
  actions = [],
  onSimulate,
  onApply,
  onDismiss,
  onExplain
}) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getROIColor = (roi) => {
    if (roi >= 150) return 'text-green-600 bg-green-100';
    if (roi >= 100) return 'text-blue-600 bg-blue-100';
    if (roi >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(priority)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        {priority === 'high' && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
            High Priority
          </span>
        )}
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Revenue Impact */}
        {impact && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Net Impact</span>
              {impact.delta >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className={`text-xl font-bold ${impact.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {impact.delta >= 0 ? '+' : ''}{(impact.delta / 1000).toFixed(1)}K
            </div>
            {impact.baseline && (
              <div className="text-xs text-gray-500 mt-1">
                vs baseline {(impact.baseline / 1000).toFixed(1)}K
              </div>
            )}
          </div>
        )}

        {/* ROI */}
        {roi !== undefined && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-medium mb-1">ROI</div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xl font-bold ${getROIColor(roi)}`}>
              {roi.toFixed(1)}%
            </div>
            {roi >= 100 && (
              <div className="text-xs text-green-600 mt-1 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Above target
              </div>
            )}
          </div>
        )}

        {/* Confidence */}
        {confidence !== undefined && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-medium mb-1">Confidence</div>
            <div className={`text-xl font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {confidence >= 0.85 ? 'High' : confidence >= 0.7 ? 'Medium' : 'Low'}
            </div>
          </div>
        )}
      </div>

      {/* Hierarchy Chips */}
      {hierarchy && hierarchy.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {hierarchy.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
            >
              {item.type}: {item.name} (L{item.level})
            </span>
          ))}
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div className="mb-3 space-y-1">
          {risks.slice(0, 2).map((risk, index) => (
            <div key={index} className="flex items-start text-xs">
              <AlertCircle className={`w-3 h-3 mr-1 mt-0.5 flex-shrink-0 ${
                risk.level === 'high' ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <span className="text-gray-600">{risk.message}</span>
            </div>
          ))}
          {risks.length > 2 && (
            <button
              onClick={onExplain}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              +{risks.length - 2} more risks
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t">
        {onSimulate && (
          <button
            onClick={onSimulate}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Zap className="w-4 h-4 mr-1" />
            Simulate
          </button>
        )}
        {onApply && (
          <button
            onClick={onApply}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
        {onExplain && (
          <button
            onClick={onExplain}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Explain
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Custom Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                action.variant === 'primary'
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : action.variant === 'danger'
                  ? 'text-white bg-red-600 hover:bg-red-700'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionCard;
