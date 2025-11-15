import React, { useState, useEffect, useCallback } from 'react';
import { Search, Zap, TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CommandBar = ({ isOpen, onClose, onExecute }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const commands = [
    {
      id: 'simulate',
      name: 'Simulate Promotion',
      description: 'Run a promotion simulation',
      icon: Zap,
      action: 'navigate',
      path: '/simulation-studio',
      keywords: ['simulate', 'test', 'what-if', 'scenario']
    },
    {
      id: 'next-best',
      name: 'Next Best Promotions',
      description: 'Get AI recommendations for next promotions',
      icon: TrendingUp,
      action: 'api',
      endpoint: '/api/recommendations/next-best-promotion',
      keywords: ['recommend', 'next', 'best', 'suggest']
    },
    {
      id: 'reallocate',
      name: 'Reallocate Budget',
      description: 'Get budget reallocation recommendations',
      icon: DollarSign,
      action: 'api',
      endpoint: '/api/optimizer/budget/reallocate',
      keywords: ['budget', 'reallocate', 'optimize', 'move']
    },
    {
      id: 'conflicts',
      name: 'Check Conflicts',
      description: 'Preview promotion conflicts',
      icon: AlertTriangle,
      action: 'navigate',
      path: '/promotions/conflicts',
      keywords: ['conflict', 'overlap', 'check']
    },
    {
      id: 'calendar',
      name: 'Promotions Timeline',
      description: 'View promotions calendar',
      icon: Calendar,
      action: 'navigate',
      path: '/timeline',
      keywords: ['calendar', 'timeline', 'schedule']
    },
    {
      id: 'segment',
      name: 'Segment Customers',
      description: 'Run customer segmentation',
      icon: Users,
      action: 'api',
      endpoint: '/api/ai-orchestrator/orchestrate',
      payload: { userIntent: 'Segment customers using RFM analysis' },
      keywords: ['segment', 'customers', 'rfm', 'groups']
    }
  ];

  const filterCommands = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      return commands.slice(0, 5);
    }

    const lowerQuery = searchQuery.toLowerCase();
    return commands.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some(kw => kw.includes(lowerQuery))
    );
  }, []);

  useEffect(() => {
    setResults(filterCommands(query));
    setSelectedIndex(0);
  }, [query, filterCommands]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleExecute(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleExecute = async (command) => {
    if (command.action === 'navigate') {
      onExecute({ type: 'navigate', path: command.path });
      onClose();
    } else if (command.action === 'api') {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${API_BASE_URL}${command.endpoint}`,
          command.payload || {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        onExecute({ type: 'api', command: command.id, data: response.data });
        onClose();
      } catch (error) {
        console.error('Command execution failed:', error);
        onExecute({ type: 'error', error: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 outline-none text-lg"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((cmd, index) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleExecute(cmd)}
                    className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${
                      index === selectedIndex ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        index === selectedIndex ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{cmd.name}</div>
                      <div className="text-sm text-gray-500">{cmd.description}</div>
                    </div>
                    {index === selectedIndex && (
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No commands found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <div>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-1">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-2">↓</kbd>
            to navigate
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded mr-1">↵</kbd>
            to select
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBar;
