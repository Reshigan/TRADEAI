import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiService, AIInsight } from '../../api/services/ai';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface AIInsightsWidgetProps {
  context?: string;
  limit?: number;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ context, limit = 5 }) => {
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['ai-insights', context],
    queryFn: () => aiService.getInsights(context),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="text-blue-600" size={20} />;
      case 'alert':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'prediction':
        return <TrendingUp className="text-purple-600" size={20} />;
      case 'optimization':
        return <Target className="text-green-600" size={20} />;
      default:
        return <Sparkles className="text-gray-600" size={20} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <CardTitle>AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <CardTitle>AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            <AlertTriangle size={32} className="mx-auto mb-2" />
            <p>Unable to load AI insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayInsights = insights?.slice(0, limit) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600" size={24} />
          <CardTitle>AI Insights</CardTitle>
          <Badge variant="info" className="ml-auto">Powered by AI</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {displayInsights.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
            <p>No insights available at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayInsights.map((insight: AIInsight) => (
              <div
                key={insight._id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getImpactColor(insight.impact)}>
                        {insight.impact}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {(insight.confidence * 100).toFixed(0)}% confident
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  {insight.actionable && (
                    <button className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
