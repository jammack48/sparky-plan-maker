import { jsPDF } from 'jspdf';
import { PageSetup } from '@/types/pageSetup';

export const generatePDF = async (
  canvasDataUrl: string,
  pageSetup: PageSetup,
  originalImageWidth: number,
  originalImageHeight: number
): Promise<void> => {
  // A3 landscape
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add canvas image (includes title block) at full page size
  try {
    // Fill entire page with canvas content
    pdf.addImage(canvasDataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  } catch (error) {
    console.error('Error adding canvas image to PDF:', error);
  }

  // Save the PDF
  const fileName = pageSetup.title 
    ? `${pageSetup.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
    : 'floor_plan.pdf';
  pdf.save(fileName);
};
