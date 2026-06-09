import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

export async function generateTicketPDF({ ticketUrl }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const qrDataUrl = await QRCode.toDataURL(ticketUrl, { width: 400, margin: 2 });
  const qrBase64 = qrDataUrl.split(',')[1];
  const qrBytes = Buffer.from(qrBase64, 'base64');
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const pageW = page.getWidth();
  const pageH = page.getHeight();
  const qrSize = Math.min(qrImage.width, pageW - 40, pageH - 40);
  const qrX = (pageW - qrSize) / 2;
  const qrY = (pageH - qrSize) / 2;

  page.drawImage(qrImage, {
    x: qrX, y: qrY,
    width: qrSize, height: qrSize,
  });

  return await pdfDoc.save();
}
