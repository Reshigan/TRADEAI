/**
 * Export Utility for Process Components
 * Export process visualizations to PDF, PNG, and other formats
 * World-class export with high-quality rendering and customization
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  /** Export format */
  format: 'pdf' | 'png' | 'jpeg' | 'svg';
  /** File name (without extension) */
  filename?: string;
  /** Page orientation for PDF */
  orientation?: 'portrait' | 'landscape';
  /** Page size for PDF */
  pageSize?: 'a4' | 'letter' | 'legal' | 'custom';
  /** Custom page dimensions (mm) */
  pageDimensions?: { width: number; height: number };
  /** Include metadata (title, date, etc.) */
  includeMetadata?: boolean;
  /** Quality for image exports (0-1) */
  quality?: number;
  /** Scale factor for high DPI */
  scale?: number;
  /** Background color */
  backgroundColor?: string;
  /** Padding in pixels */
  padding?: number;
  /** Callback before export */
  onBeforeExport?: () => void | Promise<void>;
  /** Callback after export */
  onAfterExport?: (blob: Blob) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface ExportResult {
  /** Success status */
  success: boolean;
  /** Exported blob */
  blob?: Blob;
  /** Download URL */
  url?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Export duration in ms */
  duration?: number;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export DOM element to PNG
 */
export async function exportToPNG(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  
  try {
    options.onBeforeExport?.();

    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#FFFFFF',
      scale: options.scale || 2, // 2x for retina
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true,
    });

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/png',
        options.quality || 1.0
      );
    });

    const result: ExportResult = {
      success: true,
      blob,
      url: URL.createObjectURL(blob),
      fileSize: blob.size,
      duration: Date.now() - startTime,
    };

    options.onAfterExport?.(blob);
    return result;
  } catch (error: any) {
    const result: ExportResult = {
      success: false,
      error: error.message || 'Failed to export to PNG',
      duration: Date.now() - startTime,
    };

    options.onError?.(error);
    return result;
  }
}

/**
 * Export DOM element to JPEG
 */
export async function exportToJPEG(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  
  try {
    options.onBeforeExport?.();

    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#FFFFFF',
      scale: options.scale || 2,
      logging: false,
      useCORS: true,
    });

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        options.quality || 0.95
      );
    });

    const result: ExportResult = {
      success: true,
      blob,
      url: URL.createObjectURL(blob),
      fileSize: blob.size,
      duration: Date.now() - startTime,
    };

    options.onAfterExport?.(blob);
    return result;
  } catch (error: any) {
    options.onError?.(error);
    return {
      success: false,
      error: error.message || 'Failed to export to JPEG',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Export DOM element to PDF
 */
export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  
  try {
    options.onBeforeExport?.();

    // Get page dimensions
    const pageSizes = {
      a4: { width: 210, height: 297 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 },
    };

    const pageSize = options.pageSize || 'a4';
    const dimensions = options.pageDimensions || pageSizes[pageSize];
    const orientation = options.orientation || 'portrait';

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: options.pageSize || 'a4',
    });

    // Capture canvas
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#FFFFFF',
      scale: options.scale || 2,
      logging: false,
      useCORS: true,
    });

    // Calculate dimensions to fit page
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = dimensions.width - (options.padding || 10) * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add metadata if requested
    if (options.includeMetadata) {
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 10);
    }

    // Add image to PDF
    const yOffset = options.includeMetadata ? 20 : 10;
    pdf.addImage(imgData, 'PNG', options.padding || 10, yOffset, imgWidth, imgHeight);

    // Convert to blob
    const pdfBlob = pdf.output('blob');

    const result: ExportResult = {
      success: true,
      blob: pdfBlob,
      url: URL.createObjectURL(pdfBlob),
      fileSize: pdfBlob.size,
      duration: Date.now() - startTime,
    };

    options.onAfterExport?.(pdfBlob);
    return result;
  } catch (error: any) {
    options.onError?.(error);
    return {
      success: false,
      error: error.message || 'Failed to export to PDF',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Export to SVG (for simple diagrams)
 */
export async function exportToSVG(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  
  try {
    options.onBeforeExport?.();

    // Get SVG content
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });

    const result: ExportResult = {
      success: true,
      blob,
      url: URL.createObjectURL(blob),
      fileSize: blob.size,
      duration: Date.now() - startTime,
    };

    options.onAfterExport?.(blob);
    return result;
  } catch (error: any) {
    options.onError?.(error);
    return {
      success: false,
      error: error.message || 'Failed to export to SVG',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Main export function - routes to appropriate format
 */
export async function exportProcess(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  switch (options.format) {
    case 'pdf':
      return exportToPDF(element, options);
    case 'png':
      return exportToPNG(element, options);
    case 'jpeg':
      return exportToJPEG(element, options);
    case 'svg':
      return exportToSVG(element, options);
    default:
      return {
        success: false,
        error: `Unsupported format: ${options.format}`,
      };
  }
}

/**
 * Download exported file
 */
export function downloadExport(result: ExportResult, filename: string): void {
  if (!result.success || !result.url) {
    console.error('Cannot download: export failed or no URL');
    return;
  }

  const link = document.createElement('a');
  link.href = result.url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up after delay
  setTimeout(() => {
    URL.revokeObjectURL(result.url);
  }, 100);
}

/**
 * Export with automatic download
 */
export async function exportAndDownload(
  element: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const result = await exportProcess(element, options);
  
  if (result.success) {
    const extension = options.format || 'png';
    const filename = `${options.filename || 'export'}.${extension}`;
    downloadExport(result, filename);
  }
  
  return result;
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useCallback } from 'react';

interface UseExportReturn {
  isExporting: boolean;
  progress: number;
  error: string | null;
  export: (element: HTMLElement, options: ExportOptions) => Promise<ExportResult>;
  exportAndDownload: (element: HTMLElement, options: ExportOptions) => Promise<void>;
  cancel: () => void;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportFn = useCallback(async (
    element: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      const result = await exportProcess(element, {
        ...options,
        onBeforeExport: async () => {
          setProgress(10);
          await options.onBeforeExport?.();
        },
        onAfterExport: (blob) => {
          setProgress(100);
          options.onAfterExport?.(blob);
        },
        onError: (err) => {
          setError(err.message);
          options.onError?.(err);
        },
      });

      if (!result.success) {
        setError(result.error || 'Export failed');
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportAndDownloadFn = useCallback(async (
    element: HTMLElement,
    options: ExportOptions
  ) => {
    const result = await exportFn(element, options);
    
    if (result.success) {
      const extension = options.format || 'png';
      const filename = `${options.filename || 'export'}.${extension}`;
      downloadExport(result, filename);
    }
  }, [exportFn]);

  const cancel = useCallback(() => {
    setIsExporting(false);
    setProgress(0);
    setError('Export cancelled');
  }, []);

  return {
    isExporting,
    progress,
    error,
    export: exportFn,
    exportAndDownload: exportAndDownloadFn,
    cancel,
  };
}

// ============================================================================
// Export Button Component
// ============================================================================

import React from 'react';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { Download as DownloadIcon, PictureAsPdf as PdfIcon, Image as ImageIcon } from '@mui/icons-material';

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
  formats?: ExportOptions['format'][];
  onExport?: (result: ExportResult) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  targetRef,
  filename = 'process-export',
  formats = ['pdf', 'png'],
  onExport,
}) => {
  const { isExporting, progress, error, exportAndDownload } = useExport();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleExport = async (format: ExportOptions['format']) => {
    if (!targetRef.current) return;

    setAnchorEl(null);
    
    const result = await exportAndDownload(targetRef.current, {
      format,
      filename: `${filename}-${format}`,
      includeMetadata: true,
      scale: 2,
    });

    onExport?.(result);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={isExporting}
      >
        {isExporting ? `${progress}%` : 'Export'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {formats.includes('pdf') && (
          <MenuItem onClick={() => handleExport('pdf')}>
            <PdfIcon sx={{ mr: 1, fontSize: 20 }} />
            PDF Document
          </MenuItem>
        )}
        {formats.includes('png') && (
          <MenuItem onClick={() => handleExport('png')}>
            <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
            PNG Image
          </MenuItem>
        )}
        {formats.includes('jpeg') && (
          <MenuItem onClick={() => handleExport('jpeg')}>
            <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
            JPEG Image
          </MenuItem>
        )}
      </Menu>

      {error && (
        <Button
          color="error"
          size="small"
          onClick={() => setError(null)}
        >
          {error}
        </Button>
      )}
    </>
  );
};

export default {
  exportProcess,
  exportToPNG,
  exportToJPEG,
  exportToPDF,
  exportToSVG,
  downloadExport,
  exportAndDownload,
  useExport,
  ExportButton,
};
