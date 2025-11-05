import { jsPDF } from 'jspdf';
import { PageSetup } from '@/types/pageSetup';

export const generatePDF = async (
  canvasDataUrl: string,
  pageSetup: PageSetup,
  originalImageWidth: number,
  originalImageHeight: number
): Promise<void> => {
  // A3 landscape, no scaling
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add canvas image at 100% - no scaling, centered on page
  try {
    // Place image centered on A3 page (no margins, no scaling)
    const imgWidthMm = (originalImageWidth * 25.4) / 96; // px to mm (96 DPI)
    const imgHeightMm = (originalImageHeight * 25.4) / 96;
    
    const imgX = (pageWidth - imgWidthMm) / 2;
    const imgY = (pageHeight - imgHeightMm) / 2;
    
    pdf.addImage(canvasDataUrl, 'PNG', imgX, imgY, imgWidthMm, imgHeightMm);
  } catch (error) {
    console.error('Error adding canvas image to PDF:', error);
  }

  // Save the PDF
  const fileName = pageSetup.title 
    ? `${pageSetup.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
    : 'floor_plan.pdf';
  pdf.save(fileName);
};
