import { jsPDF } from 'jspdf';
import { PageSetup } from '@/types/pageSetup';

export const generatePDF = async (
  canvasDataUrl: string,
  pageSetup: PageSetup,
  originalImageWidth: number,
  originalImageHeight: number
): Promise<void> => {
  // Force landscape orientation for floor plans
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Calculate margins as percentage of page dimensions
  const margin = (pageSetup.layout.marginSize / 100) * Math.min(pageWidth, pageHeight);
  const titleBarHeightMm = pageSetup.layout.titleBarHeight * 0.264583; // px to mm
  
  // Calculate available content area (title block at bottom)
  const contentX = margin;
  const contentY = margin;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - 2 * margin - titleBarHeightMm;
  const titleBlockY = pageHeight - margin - titleBarHeightMm;

  // Draw border if enabled
  if (pageSetup.border.enabled) {
    pdf.setDrawColor(pageSetup.border.color);
    pdf.setLineWidth(pageSetup.border.thickness * 0.264583); // px to mm
    
    if (pageSetup.border.style === 'double') {
      const offset = pageSetup.border.thickness * 0.264583 * 2;
      pdf.rect(margin - offset, margin - offset, pageWidth - 2 * margin + 2 * offset, pageHeight - 2 * margin + 2 * offset);
      pdf.rect(margin + offset, margin + offset, pageWidth - 2 * margin - 2 * offset, pageHeight - 2 * margin - 2 * offset);
    } else {
      // For solid and dashed, just draw a single border (jsPDF doesn't support setLineDash in types)
      pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    }
  }

  // Draw title bar background at bottom (black)
  pdf.setFillColor(0, 0, 0);
  pdf.rect(contentX, titleBlockY, contentWidth, titleBarHeightMm, 'F');
  
  // Draw white border around title block
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.rect(contentX, titleBlockY, contentWidth, titleBarHeightMm);

  // Logo section width
  const logoSectionWidth = 30;
  let currentX = contentX;
  
  // Draw logo if provided
  if (pageSetup.logo) {
    try {
      const logoSize = (pageSetup.layout.logoSize / 100) * titleBarHeightMm * 0.8;
      const logoX = currentX + (logoSectionWidth - logoSize) / 2;
      const logoY = titleBlockY + (titleBarHeightMm - logoSize) / 2;
      pdf.addImage(pageSetup.logo, 'PNG', logoX, logoY, logoSize, logoSize);
      
      // Draw vertical separator after logo
      pdf.setDrawColor(255, 255, 255);
      pdf.line(contentX + logoSectionWidth, titleBlockY, contentX + logoSectionWidth, titleBlockY + titleBarHeightMm);
      currentX += logoSectionWidth;
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Table layout for text fields
  const tableStartX = currentX;
  const tableWidth = contentWidth - (pageSetup.logo ? logoSectionWidth : 0);
  const col1Width = tableWidth / 2;
  const col2Width = tableWidth / 2;
  const rowHeight = titleBarHeightMm / 3;
  
  // Draw vertical separator between columns
  pdf.setDrawColor(255, 255, 255);
  pdf.line(tableStartX + col1Width, titleBlockY, tableStartX + col1Width, titleBlockY + titleBarHeightMm);
  
  // Draw horizontal separators
  pdf.line(tableStartX, titleBlockY + rowHeight, contentX + contentWidth, titleBlockY + rowHeight);
  pdf.line(tableStartX, titleBlockY + rowHeight * 2, contentX + contentWidth, titleBlockY + rowHeight * 2);
  
  // Set text color to white
  pdf.setTextColor(255, 255, 255);
  
  // Row 1, Column 1: Client
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENT:', tableStartX + 2, titleBlockY + rowHeight / 2 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text(pageSetup.title || '', tableStartX + 15, titleBlockY + rowHeight / 2 - 1);
  
  // Row 2, Column 1: Description
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION:', tableStartX + 2, titleBlockY + rowHeight * 1.5 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text(pageSetup.subtitle || 'Floor Plan', tableStartX + 25, titleBlockY + rowHeight * 1.5 - 1);
  
  // Row 3, Column 1: Job Address
  pdf.setFont('helvetica', 'bold');
  pdf.text('JOB ADDRESS:', tableStartX + 2, titleBlockY + rowHeight * 2.5 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text(pageSetup.details || '', tableStartX + 25, titleBlockY + rowHeight * 2.5 - 1, { maxWidth: col1Width - 27 });
  
  // Row 1, Column 2: File name
  pdf.setFont('helvetica', 'bold');
  pdf.text('FILE NAME:', tableStartX + col1Width + 2, titleBlockY + rowHeight / 2 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text(pageSetup.footer || 'floor_plan.pdf', tableStartX + col1Width + 20, titleBlockY + rowHeight / 2 - 1);
  
  // Row 2, Column 2: Date
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE:', tableStartX + col1Width + 2, titleBlockY + rowHeight * 1.5 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date().toLocaleDateString(), tableStartX + col1Width + 12, titleBlockY + rowHeight * 1.5 - 1);
  
  // Row 3, Column 2: Sheet
  pdf.setFont('helvetica', 'bold');
  pdf.text('SHEET:', tableStartX + col1Width + 2, titleBlockY + rowHeight * 2.5 - 1);
  pdf.setFont('helvetica', 'normal');
  pdf.text('1 of 1', tableStartX + col1Width + 14, titleBlockY + rowHeight * 2.5 - 1);

  // Add the canvas image to PDF
  try {
    // Calculate scaling to fit within content area while maintaining aspect ratio
    const imageAspect = originalImageWidth / originalImageHeight;
    const contentAspect = contentWidth / contentHeight;
    
    let imgWidth = contentWidth;
    let imgHeight = contentHeight;
    let imgX = contentX;
    let imgY = contentY;
    
    if (imageAspect > contentAspect) {
      // Image is wider, fit to width
      imgHeight = contentWidth / imageAspect;
      imgY = contentY + (contentHeight - imgHeight) / 2;
    } else {
      // Image is taller, fit to height
      imgWidth = contentHeight * imageAspect;
      imgX = contentX + (contentWidth - imgWidth) / 2;
    }
    
    pdf.addImage(canvasDataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding canvas image to PDF:', error);
  }

  // Draw footer if provided
  if (pageSetup.footer) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(pageSetup.footer, pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
  }

  // Save the PDF
  const fileName = pageSetup.title 
    ? `${pageSetup.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
    : 'floor_plan.pdf';
  pdf.save(fileName);
};
