import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

const CopilotPanel = ({ isOpen, onClose, context, recommendations }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');

  if (!isOpen) return null;

  const tabs = [
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'impact', label: 'Expected Impact', icon: TrendingUp },
    { id: 'assumptions', label: 'Assumptions', icon: Info },
    { id: 'risks', label: 'Risks', icon: AlertCircle }
  ];

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900">AI Copilot</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {context?.explanation ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {context.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No AI insights available yet</p>
                    <p className="text-xs mt-1">Make a selection to see recommendations</p>
                  </div>
                )}

                {recommendations && recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Recommendations</h4>
                    {recommendations.map((rec, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          {rec.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {rec.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="space-y-4">
                {context?.expectedImpact ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs text-green-600 font-medium mb-1">Revenue Impact</div>
                        <div className="text-2xl font-bold text-green-700">
                          {context.expectedImpact.revenue ? `$${(context.expectedImpact.revenue / 1000).toFixed(1)}K` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">ROI</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {context.expectedImpact.roi ? `${context.expectedImpact.roi.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {context.expectedImpact.breakdown && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Impact Breakdown</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                          {Object.entries(context.expectedImpact.breakdown).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium text-gray-900">
                                {typeof value === 'number' ? `$${(value / 1000).toFixed(1)}K` : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No impact data available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assumptions' && (
              <div className="space-y-3">
                {context?.assumptions && context.assumptions.length > 0 ? (
                  context.assumptions.map((assumption, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{assumption}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No assumptions listed</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-3">
                {context?.risks && context.risks.length > 0 ? (
                  context.risks.map((risk, index) => (
                    <div key={index} className={`border rounded-lg p-3 ${
                      risk.level === 'high'
                        ? 'bg-red-50 border-red-200'
                        : risk.level === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start">
                        <AlertCircle className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          risk.level === 'high'
                            ? 'text-red-600'
                            : risk.level === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{risk.message}</p>
                          {risk.mitigation && (
                            <p className="text-xs text-gray-600 mt-1">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No risks identified</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {context?.actions && context.actions.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="space-y-2">
                {context.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      action.primary
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CopilotPanel;
