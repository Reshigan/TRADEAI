// DEPRECATED: This module is not used in production. The Workers backend (workers-backend/)
// is the active production backend. This Express/NestJS service is retained for reference only.

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './interfaces/conversation.interface';
import { Insight } from './interfaces/insight.interface';
import { Prediction } from './interfaces/prediction.interface';

@Injectable()
export class AIAssistantService {
  constructor(
    @InjectModel('Conversation') private conversationModel: Model<Conversation>,
    @InjectModel('Insight') private insightModel: Model<Insight>,
    @InjectModel('Prediction') private predictionModel: Model<Prediction>,
  ) {}

  async startConversation(userId: string, context: string) {
    const conversation = new this.conversationModel({
      user: userId,
      context,
      messages: [],
    });
    return conversation.save();
  }

  async addMessageToConversation(
    conversationId: string, 
    message: { 
      sender: 'user' | 'ai', 
      content: string, 
      metadata?: any 
    }
  ) {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.messages.push({
      ...message,
      timestamp: new Date(),
    });

    // Analyze message intent and sentiment
    const intent = this.analyzeIntent(message.content);
    const sentiment = this.analyzeSentiment(message.content);

    conversation.intent = intent;
    conversation.sentiment = sentiment;

    return conversation.save();
  }

  async generateCampaignInsights(campaignData: any) {
    const insight = new this.insightModel({
      user: campaignData.owner,
      type: 'predictive',
      domain: 'trade_marketing',
      title: `Campaign Insights: ${campaignData.name}`,
      description: 'AI-generated insights for campaign optimization',
      data: campaignData,
      recommendations: this.generateRecommendations(campaignData),
    });

    return insight.save();
  }

  async analyzeProposalRisk(proposalData: any) {
    const prediction = new this.predictionModel({
      user: proposalData.creator,
      type: 'risk_assessment',
      timeframe: 'medium_term',
      data: proposalData,
      prediction: this.calculateRiskScore(proposalData),
      scenarios: this.generateRiskScenarios(proposalData),
    });

    return prediction.save();
  }

  async predictSpendForecast(spendData: any) {
    const prediction = new this.predictionModel({
      user: spendData.user,
      type: 'budget_projection',
      timeframe: 'short_term',
      data: spendData,
      prediction: this.forecastSpend(spendData),
      recommendations: this.generateSpendRecommendations(spendData),
    });

    return prediction.save();
  }

  private analyzeIntent(message: string): string {
    // Basic NLP intent detection
    const intentPatterns = {
      'query': ['what', 'how', 'why', 'explain'],
      'analysis': ['analyze', 'breakdown', 'insights'],
      'recommendation': ['suggest', 'recommend', 'advise'],
      'prediction': ['forecast', 'predict', 'estimate'],
      'clarification': ['clarify', 'elaborate', 'detail']
    };

    const lowercaseMessage = message.toLowerCase();
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'query';
  }

  private analyzeSentiment(message: string): string {
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible'];

    const lowercaseMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowercaseMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowercaseMessage.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(data: any): any[] {
    // Placeholder for AI recommendation generation
    return [
      {
        action: 'Optimize marketing channels',
        impact: 75,
        probability: 0.8
      },
      {
        action: 'Adjust budget allocation',
        impact: 60,
        probability: 0.7
      }
    ];
  }

  private calculateRiskScore(proposalData: any): number {
    // Placeholder risk calculation
    const baseRisk = 50;
    const budgetRisk = proposalData.budget.total > 100000 ? 20 : 0;
    const timelineRisk = (new Date(proposalData.timeline.endDate) - new Date(proposalData.timeline.startDate)) > 180 ? 15 : 0;

    return Math.min(baseRisk + budgetRisk + timelineRisk, 100);
  }

  private generateRiskScenarios(proposalData: any): any[] {
    return [
      {
        name: 'Budget Overrun',
        probability: 0.3,
        impact: 70,
        description: 'High likelihood of exceeding initial budget'
      },
      {
        name: 'Timeline Delay',
        probability: 0.4,
        impact: 60,
        description: 'Potential delays in project completion'
      }
    ];
  }

  private forecastSpend(spendData: any): any {
    // Placeholder spend forecast
    const totalBudget = spendData.totalBudget;
    const currentSpent = spendData.spendEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return {
      currentSpendRate: currentSpent / totalBudget,
      projectedTotalSpend: currentSpent * 1.2,
      remainingBudget: totalBudget - currentSpent
    };
  }

  private generateSpendRecommendations(spendData: any): any[] {
    return [
      {
        action: 'Reduce discretionary spending',
        probability: 0.7,
        impact: 65
      },
      {
        action: 'Reallocate budget to high-performing channels',
        probability: 0.8,
        impact: 75
      }
    ];
  }
}
