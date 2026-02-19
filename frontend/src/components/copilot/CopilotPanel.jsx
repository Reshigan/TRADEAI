import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Drawer, Typography, TextField, IconButton, Paper, Chip, CircularProgress,
  Divider, alpha
} from '@mui/material';
import {
  Close as CloseIcon, Send as SendIcon, SmartToy as AIIcon,
  Person as PersonIcon, TrendingUp as TrendingUpIcon,
  BarChart as ChartIcon, AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import { aiCopilotService } from '../../services/api';

const CopilotPanel = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hi! I\'m your AI Trade Copilot. Ask me anything about budgets, promotions, claims, deductions, or trade spend analytics.',
        timestamp: new Date().toISOString()
      }]);
      loadSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSuggestions = async () => {
    try {
      const res = await aiCopilotService.suggestActions();
      if (res.success && res.data?.actions) {
        setSuggestions(res.data.actions.slice(0, 4));
      }
    } catch (e) {
      setSuggestions([
        { title: 'Budget utilization summary' },
        { title: 'Top performing promotions' },
        { title: 'Pending claims overview' },
        { title: 'Deduction reconciliation status' }
      ]);
    }
  };

  const handleSend = async (questionText) => {
    const question = questionText || input.trim();
    if (!question) return;

    setMessages(prev => [...prev, { role: 'user', content: question, timestamp: new Date().toISOString() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiCopilotService.ask(question, context);
      const data = res.data || res;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || data.message || 'I processed your question but couldn\'t generate a specific answer.',
        data: data.data,
        suggestions: data.suggestions,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatValue = (v) => typeof v === 'number' ? `R${v.toLocaleString('en-ZA')}` : String(v);

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#FAFBFC' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SparklesIcon />
            <Box>
              <Typography fontWeight={700} fontSize="1rem">AI Trade Copilot</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>Powered by TRADEAI Intelligence</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '90%' }}>
                {msg.role === 'assistant' && (
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: alpha('#7C3AED', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                    <AIIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                  </Box>
                )}
                <Paper elevation={0} sx={{
                  p: 1.5, borderRadius: '12px',
                  bgcolor: msg.role === 'user' ? '#7C3AED' : 'white',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</Typography>

                  {msg.data && typeof msg.data === 'object' && (
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: alpha('#7C3AED', 0.04), borderRadius: '8px' }}>
                      {Object.entries(msg.data).slice(0, 6).map(([k, v]) => (
                        <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                          <Typography variant="caption" color="text.secondary">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Typography>
                          <Typography variant="caption" fontWeight={600}>{formatValue(v)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {msg.suggestions.map((s, j) => (
                        <Chip key={j} label={typeof s === 'string' ? s : s.text || s.title} size="small"
                          onClick={() => handleSend(typeof s === 'string' ? s : s.text || s.title)}
                          sx={{ borderRadius: '8px', fontSize: '0.7rem', bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', cursor: 'pointer', '&:hover': { bgcolor: alpha('#7C3AED', 0.15) } }} />
                      ))}
                    </Box>
                  )}
                </Paper>
                {msg.role === 'user' && (
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: alpha('#7C3AED', 0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                )}
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 4.5 }}>
              <CircularProgress size={16} sx={{ color: '#7C3AED' }} />
              <Typography variant="caption" color="text.secondary">Analyzing...</Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {suggestions.length > 0 && messages.length <= 1 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>Suggested questions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {suggestions.map((s, i) => (
                <Chip key={i} label={s.title || s} size="small"
                  icon={i % 2 === 0 ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <ChartIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => handleSend(s.title || s)}
                  sx={{ borderRadius: '8px', fontSize: '0.7rem', bgcolor: alpha('#7C3AED', 0.06), '&:hover': { bgcolor: alpha('#7C3AED', 0.12) }, cursor: 'pointer' }} />
              ))}
            </Box>
          </Box>
        )}

        <Divider />
        <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField fullWidth multiline maxRows={3} placeholder="Ask about budgets, promotions, claims..."
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress}
            variant="outlined" size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white', fontSize: '0.875rem' } }} />
          <IconButton onClick={() => handleSend()} disabled={!input.trim() || loading}
            sx={{ bgcolor: '#7C3AED', color: 'white', borderRadius: '10px', width: 38, height: 38, '&:hover': { bgcolor: '#6D28D9' }, '&.Mui-disabled': { bgcolor: alpha('#7C3AED', 0.3), color: 'white' } }}>
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CopilotPanel;
