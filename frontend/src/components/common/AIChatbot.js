import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Fab,
  Fade,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ollamaService } from '../../services/ollama/ollamaService';

const AIChatbot = ({ pageContext, contextData, open, onClose }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkOllama();
    
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm your AI assistant. I can help with ${pageContext || 'TRADEAI'}. What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkOllama = async () => {
    const check = await ollamaService.checkAvailability();
    setIsOllamaAvailable(check.available);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare context
      const context = {
        page: pageContext,
        dataContext: contextData
      };

      // Get AI response
      const result = await ollamaService.generate(input, context);
      
      const assistantMessage = {
        role: 'assistant',
        content: result.usingFallback ? result.fallback : result.response,
        timestamp: new Date(),
        model: result.model,
        usingFallback: result.usingFallback
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
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

  const handleClearChat = () => {
    ollamaService.clearHistory();
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! What would you like to know about ${pageContext || 'TRADEAI'}?`,
      timestamp: new Date()
    }]);
  };

  const quickPrompts = [
    '📊 Analyze this data',
    '💡 Give me insights',
    '🎯 Recommendations',
    '❓ How to optimize?'
  ];

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 400,
          height: 600,
          display: open ? 'flex' : 'none',
          flexDirection: 'column',
          zIndex: 1300,
          borderRadius: 3,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #6D28D9 0%, #0d47a1 100%)'
            : 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {isOllamaAvailable ? '🟢 Ollama Active' : '🟡 Fallback Mode'}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Clear chat">
              <IconButton size="small" onClick={handleClearChat} sx={{ color: 'white', mr: 0.5 }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            background: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.map((message, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                gap: 1,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              {message.role === 'assistant' && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <AIIcon fontSize="small" />
                </Avatar>
              )}
              
              <Box>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: message.role === 'user' 
                      ? 'primary.main' 
                      : theme.palette.mode === 'dark' ? '#1e1e1e' : 'white',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    ...(message.error && {
                      bgcolor: 'error.light',
                      color: 'error.contrastText'
                    })
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  
                  {message.usingFallback && (
                    <Chip 
                      label="Smart Response" 
                      size="small" 
                      sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }}
                    />
                  )}
                </Paper>
                
                <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.6, display: 'block' }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>

              {message.role === 'user' && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
              )}
            </Box>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AIIcon fontSize="small" />
              </Avatar>
              <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, flexWrap: 'wrap', bgcolor: 'background.paper' }}>
            {quickPrompts.map((prompt, idx) => (
              <Chip
                key={idx}
                label={prompt}
                size="small"
                onClick={() => setInput(prompt.substring(2))}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        )}

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground'
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

// Floating Action Button to open chatbot
export const AIChatbotFAB = ({ pageContext, contextData }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="AI Assistant" placement="left">
        <Fab
          color="secondary"
          onClick={() => setOpen(!open)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 104,
            zIndex: 1200,
            background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5B21B6 0%, #6D28D9 100%)',
            }
          }}
        >
          {open ? <CloseIcon /> : <ChatIcon />}
        </Fab>
      </Tooltip>

      <AIChatbot
        pageContext={pageContext}
        contextData={contextData}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default AIChatbot;
