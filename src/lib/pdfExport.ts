import { jsPDF } from 'jspdf';
import { PageSetup } from '@/types/pageSetup';

export const generatePDF = async (
  canvasDataUrl: string,
  pageSetup: PageSetup,
  originalImageWidth: number,
  originalImageHeight: number
): Promise<void> => {
  // Determine page orientation based on image aspect ratio
  const isLandscape = originalImageWidth > originalImageHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
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

  // Draw title bar background at bottom
  pdf.setFillColor(245, 245, 245);
  pdf.rect(contentX, titleBlockY, contentWidth, titleBarHeightMm, 'F');

  // Draw logo if provided
  if (pageSetup.logo) {
    try {
      const logoSize = (pageSetup.layout.logoSize / 100) * titleBarHeightMm;
      let logoX = contentX + 5;
      
      if (pageSetup.layout.logoPosition === 'center') {
        logoX = contentX + (contentWidth - logoSize) / 2;
      } else if (pageSetup.layout.logoPosition === 'right') {
        logoX = contentX + contentWidth - logoSize - 5;
      }
      
      const logoY = titleBlockY + (titleBarHeightMm - logoSize) / 2;
      pdf.addImage(pageSetup.logo, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Draw title and subtitle
  pdf.setTextColor(0, 0, 0);
  
  const textStartX = pageSetup.logo && pageSetup.layout.logoPosition === 'left' 
    ? contentX + (pageSetup.layout.logoSize / 100) * titleBarHeightMm + 10
    : contentX + 5;
  
  const textStartY = titleBlockY + titleBarHeightMm / 2;

  if (pageSetup.title) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pageSetup.title, textStartX, textStartY - 3);
  }

  if (pageSetup.subtitle) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(pageSetup.subtitle, textStartX, textStartY + 5);
  }

  if (pageSetup.details) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(pageSetup.details, textStartX, textStartY + 11);
  }

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
