import jsPDF from 'jspdf';

const fetchImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image from URL.", error);
    return null; 
  }
};

const safelyFormatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate().toLocaleDateString();
  }
  try {
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
    return 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

const generateReceipt = async (bookingDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Background
  const headerColor = '#2c3e50'; 
  doc.setFillColor(headerColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // 2. Fetch and Add Logo
  const logoUrl = 'https://i.ibb.co/ycCH30Qh/Gemini-Generated-Image-1ewk341ewk341ewk.png';
  const logoBase64 = await fetchImageAsBase64(logoUrl);
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 15, 7, 25, 25);
  }

  // 3. Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text('E-AWAS Payment Receipt', pageWidth / 2, 25, { align: 'center' });

  // 4. "PAID" Stamp Watermark
  doc.saveGraphicsState();
  const gState = new doc.GState({ opacity: 0.15 });
  doc.setGState(gState);
  doc.setFontSize(140);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#e74c3c'); 
  doc.text('PAID', pageWidth / 2, pageHeight / 2 + 15, { 
    align: 'center', 
    angle: 45 
  });
  doc.restoreGraphicsState();

  // 5. Booking Details Table
  const details = [
    { title: 'Booking ID', value: bookingDetails.applicationId || bookingDetails.id || 'N/A' },
    { title: 'Guest House', value: bookingDetails.guestHouseName || 'N/A' },
    { title: 'Booked From', value: safelyFormatDate(bookingDetails.startDate) },
    { title: 'Booked To', value: safelyFormatDate(bookingDetails.endDate) },
    { title: 'Paid By', value: bookingDetails.userName || 'N/A' },
    { title: 'Amount Paid', value: `INR ${bookingDetails.totalAmount}` }
  ];

  const startX = 20;
  const tableWidth = pageWidth - 40;
  const col1Width = tableWidth * 0.35;
  const col2Width = tableWidth * 0.65;
  const rowHeight = 16;
  let yPosition = 70;

  doc.setDrawColor('#bdc3c7');
  doc.setLineWidth(0.3);

  details.forEach(detail => {
    doc.rect(startX, yPosition, col1Width, rowHeight, 'S');
    doc.rect(startX + col1Width, yPosition, col2Width, rowHeight, 'S');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#34495e'); 
    doc.text(detail.title, startX + 5, yPosition + 11);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000'); 
    doc.text(String(detail.value), startX + col1Width + 5, yPosition + 11);
    
    yPosition += rowHeight; 
  });

  // 6. Footer
  const footerY = pageHeight - 30;
  doc.setLineWidth(0.5);
  doc.setDrawColor('#bdc3c7');
  doc.line(10, footerY, pageWidth - 10, footerY);
  doc.setFontSize(10);
  doc.setTextColor('#7f8c8d');
  doc.text('Thank you for your payment!', pageWidth / 2, footerY + 10, { align: 'center' });

  doc.save(`receipt_${bookingDetails.id || 'booking'}.pdf`);
};

export default generateReceipt;