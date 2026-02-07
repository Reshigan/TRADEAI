import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  Drawer,
  Avatar,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../services/api';

const getAIResponse = async (message, context) => {
  try {
    const response = await api.post('/ai/chat', {
      message,
      context,
      timestamp: new Date().toISOString()
    });

    return response.data?.response || "I'm here to help you with your trade spend analysis. What would you like to know?";
  } catch (error) {
    console.error('AI service error:', error);
    return "I'm currently experiencing technical difficulties. Please try again later or contact support for assistance.";
  }
};

const AIAssistant = ({ context = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: `Hello! I'm your Trade AI Assistant for the South African market. How can I help you with your ${context} today?`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    // Get AI response
    try {
      const response = await getAIResponse(newMessage, context);
      
      // Add AI response
      const aiMessage = {
        id: messages.length + 2,
        sender: 'ai',
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        sender: 'ai',
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      { 
        id: 1, 
        sender: 'ai', 
        text: `Hello! I'm your Trade AI Assistant for the South African market. How can I help you with your ${context} today?`,
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating button to open chat */}
      <Tooltip title="AI Assistant" placement="left">
        <Fab
          color="primary"
          aria-label="AI Assistant"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
          onClick={() => setIsOpen(true)}
        >
          <SmartToyIcon />
        </Fab>
      </Tooltip>

      {/* Chat drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%'
          }
        }}
      >
        {/* Chat header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: 'primary.main',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Trade AI Assistant</Typography>
          </Box>
          <Box>
            <Tooltip title="Clear conversation">
              <IconButton color="inherit" onClick={clearConversation}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton color="inherit" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Chat messages */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: 'calc(100vh - 140px)'
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '100%'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: '80%',
                    backgroundColor: message.sender === 'user' ? 'primary.light' : 'white',
                    color: message.sender === 'user' ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body1">{message.text}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      textAlign: message.sender === 'user' ? 'right' : 'left',
                      opacity: 0.7
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}
          
          {isTyping && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'secondary.main',
                  width: 32,
                  height: 32
                }}
              >
                <SmartToyIcon />
              </Avatar>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'white'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircularProgress size={12} />
                  <Typography variant="body2">AI is typing...</Typography>
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Chat input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask me anything..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
            disabled={isTyping}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={newMessage.trim() === '' || isTyping}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
};

export default AIAssistant;
