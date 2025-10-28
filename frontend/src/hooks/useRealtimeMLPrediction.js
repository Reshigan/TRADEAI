/**
 * useRealtimeMLPrediction Hook
 * 
 * Real-time ML predictions with automatic updates
 * Perfect for live feedback as user types
 */

import { useState, useEffect, useRef } from 'react';
import mlService from '../services/ai/mlService';

const useRealtimeMLPrediction = (type, params, options = {}) => {
  const {
    debounceMs = 500,
    autoRefresh = false,
    refreshInterval = 60000
  } = options;

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Debounced prediction
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchPrediction();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [JSON.stringify(params)]);

  useEffect(() => {
    // Auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchPrediction, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchPrediction = async () => {
    if (!params || Object.keys(params).length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      switch (type) {
        case 'forecast':
          result = await mlService.forecastDemand(params);
          break;
        case 'price':
          result = await mlService.optimizePrice(params);
          break;
        case 'promotion':
          result = await mlService.analyzePromotionLift(params);
          break;
        case 'recommendations':
          result = await mlService.getProductRecommendations(params);
          break;
        default:
          throw new Error(`Unknown prediction type: ${type}`);
      }

      setPrediction(result);
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchPrediction();
  };

  return {
    prediction,
    loading,
    error,
    refresh
  };
};

export default useRealtimeMLPrediction;
