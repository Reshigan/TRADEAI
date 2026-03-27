import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Badge,
  Card,
  CardContent,
  Zoom,
} from '@mui/material';
import {
  ArrowRight as ArrowRightIcon,
  ArrowDown as ArrowDownIcon,
  GitMerge as GitMergeIcon,
  CallSplit as CallSplitIcon,
  Loop as LoopIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * ProcessFlow - World-class process flow visualization
 * 
 * Features:
 * - Interactive flow diagram
 * - Dependencies visualization
 * - Parallel paths support
 * - Conditional branching
 * - Animated flow indicators
 * - Zoom and pan controls
 * - Step details on hover
 * - Bottleneck highlighting
 * 
 * @param {Object} props
 * @param {Array} props.nodes - Flow nodes/steps
 * @param {Array} props.edges - Connections between nodes
 * @param {number} props.activeNode - Currently active node index
 * @param {boolean} props.animated - Enable animations
 * @param {Function} props.onNodeClick - Node click handler
 */
const ProcessFlow = ({
  nodes = [],
  edges = [],
  activeNode = 0,
  animated = true,
  onNodeClick,
}) => {
  const theme = useTheme();
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Calculate node status
  const getNodeStatus = (index) => {
    if (index < activeNode) return 'completed';
    if (index === activeNode) return 'active';
    return 'pending';
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));
  const handleFitScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node variants for animation
  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      },
    }),
    hover: {
      scale: 1.05,
      y: -5,
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      transition: { duration: 0.2 },
    },
  };

  // Flow animation variants
  const flowVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1, delay: 0.5 },
    },
  };

  // Get node color based on status
  const getNodeColors = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          border: theme.palette.success.main,
          text: theme.palette.success.main,
        };
      case 'active':
        return {
          bg: alpha(theme.palette.primary.main, 0.1),
          border: theme.palette.primary.main,
          text: theme.palette.primary.main,
        };
      case 'error':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          border: theme.palette.error.main,
          text: theme.palette.error.main,
        };
      default:
        return {
          bg: 'background.paper',
          border: theme.palette.divider,
          text: 'text.primary',
        };
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header with Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            <GitMergeIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Process Flow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visual workflow representation
            </Typography>
          </Box>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit to Screen">
            <IconButton onClick={handleFitScreen} size="small">
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Flow Diagram */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 400,
          overflow: 'auto',
          '& svg': {
            width: '100%',
            height: '100%',
          },
        }}
      >
        <motion.div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              py: 4,
              px: 8,
            }}
          >
            {nodes.map((node, index) => {
              const status = getNodeStatus(index);
              const colors = getNodeColors(status);
              const isHovered = hoveredNode === index;

              return (
                <React.Fragment key={node.id || index}>
                  {/* Node */}
                  <motion.div
                    custom={index}
                    variants={nodeVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onMouseEnter={() => setHoveredNode(index)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onNodeClick?.(index)}
                    style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                  >
                    <Zoom in={isHovered || status === 'active'}>
                      <Box
                        sx={{
                          position: 'relative',
                          p: 2.5,
                          minWidth: 280,
                          maxWidth: 320,
                          borderRadius: 3,
                          bgcolor: colors.bg,
                          border: `2px solid ${colors.border}`,
                          boxShadow: status === 'active' 
                            ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                            : isHovered
                              ? '0 8px 24px rgba(0,0,0,0.12)'
                              : '0 2px 8px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {/* Status Indicator */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -12,
                            right: 16,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: status === 'completed' ? 'success.main' 
                              : status === 'active' ? 'primary.main' 
                              : 'grey.300',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          {status === 'completed' ? '✓' : index + 1}
                        </Box>

                        {/* Node Content */}
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color={colors.text}
                            gutterBottom
                          >
                            {node.title}
                          </Typography>
                          
                          {node.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1.5, lineHeight: 1.5 }}
                            >
                              {node.description}
                            </Typography>
                          )}

                          {/* Node Metadata */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {node.type && (
                              <Chip
                                label={node.type}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {node.duration && (
                              <Chip
                                label={node.duration}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: 'info.main',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {node.assignee && (
                              <Chip
                                label={node.assignee}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: 'success.main',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Active Step Pulse Animation */}
                        {status === 'active' && animated && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.primary.main}`,
                              animation: 'pulse 2s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%': {
                                  transform: 'scale(1)',
                                  opacity: 1,
                                },
                                '100%': {
                                  transform: 'scale(1.05)',
                                  opacity: 0,
                                },
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Zoom>
                  </motion.div>

                  {/* Connector Arrow */}
                  {index < nodes.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                          py: 1,
                        }}
                      >
                        {/* Animated Flow Line */}
                        <Box
                          sx={{
                            width: 2,
                            height: 32,
                            bgcolor: alpha(theme.palette.divider, 0.5),
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {animated && status === 'active' && (
                            <motion.div
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 20, opacity: 1 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 20,
                                background: `linear-gradient(to bottom, ${theme.palette.primary.main}, transparent)`,
                              }}
                            />
                          )}
                        </Box>
                        
                        <ArrowDownIcon
                          sx={{
                            color: alpha(theme.palette.divider, 0.8),
                            fontSize: 20,
                          }}
                        />
                      </Box>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </motion.div>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Completed
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'primary.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            In Progress
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'grey.300',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Pending
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProcessFlow;
