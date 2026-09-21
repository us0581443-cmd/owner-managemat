import { jsPDF } from 'jspdf';

/**
 * Generates an executive, professional PDF receipt for rent payments and bills.
 * @param {Object} receiptData - Payment and tenant details
 * @returns {jsPDF} doc instance
 */
export function generateReceiptPdf(receiptData = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Data normalization
  const receiptNumber = receiptData.receipt_number || receiptData.receiptNumber || `REC-${new Date().getFullYear()}-${String(receiptData.id || 1).padStart(4, '0')}`;
  const tenantName = receiptData.tenant_name || receiptData.name || 'Resident';
  const tenantPhone = receiptData.tenant_phone || receiptData.phone || 'N/A';
  const tenantCnic = receiptData.tenant_cnic || receiptData.cnic || 'On Record';
  const flatNumber = receiptData.flat_number || 'N/A';
  const flatAddress = receiptData.flat_address || receiptData.address || 'Executive Residency, Phase 1';
  const monthYear = receiptData.month_year || 'Current Billing Cycle';
  const paymentMethod = receiptData.payment_method || 'Cash / Online Transfer';
  const paymentDate = receiptData.paid_date || receiptData.payment_date || receiptData.due_date || new Date().toISOString().split('T')[0];

  const totalAmount = Number(receiptData.amount || 0);
  const paidAmount = Number(
    receiptData.paid_amount !== undefined 
      ? receiptData.paid_amount 
      : (receiptData.amount_paid !== undefined ? receiptData.amount_paid : (receiptData.status === 'Paid' ? totalAmount : 0))
  );
  const balanceDue = Number(
    receiptData.balance_due !== undefined 
      ? receiptData.balance_due 
      : Math.max(0, totalAmount - paidAmount)
  );

  const rawStatus = (receiptData.status || (balanceDue === 0 && paidAmount > 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'))).toLowerCase();
  const isPaid = rawStatus === 'paid';
  const isPartial = rawStatus === 'partial';

  // --- Theme Colors ---
  const primaryNavy = [15, 23, 42];      // #0F172A
  const secondarySlate = [71, 85, 105];   // #475569
  const mutedGray = [148, 163, 184];      // #94A3B8
  const brandBlue = [37, 99, 235];        // #2563EB
  const lightBg = [248, 250, 252];        // #F8FAFC
  const borderGray = [226, 232, 240];     // #E2E8F0

  // Status colors
  let statusBadgeBg = [220, 252, 231];    // Mint light
  let statusBadgeBorder = [22, 163, 74];  // Mint
  let statusBadgeText = [21, 128, 61];    // Mint dark
  let statusText = 'PAID IN FULL';

  if (isPartial) {
    statusBadgeBg = [254, 243, 199];     // Amber light
    statusBadgeBorder = [217, 119, 6];   // Amber
    statusBadgeText = [180, 83, 9];      // Amber dark
    statusText = 'PARTIAL PAYMENT RECEIVED';
  } else if (!isPaid) {
    statusBadgeBg = [254, 226, 226];     // Red light
    statusBadgeBorder = [220, 38, 38];   // Red
    statusBadgeText = [185, 28, 28];     // Red dark
    statusText = 'PAYMENT PENDING';
  }

  // --- Top Decorative Bar ---
  doc.setFillColor(...brandBlue);
  doc.rect(15, 12, 180, 3.5, 'F');

  // --- Header: Branding & Company ---
  // Blue Logo Box
  doc.setFillColor(...brandBlue);
  doc.roundedRect(15, 20, 12, 12, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('N', 18.5, 28.5);

  // Brand Name
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NEST', 30, 27);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBlue);
  doc.text('EXECUTIVE PROPERTY MANAGEMENT', 30, 31.5);

  // Header Right: Document Title & Receipt Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryNavy);
  doc.text('RENT PAYMENT RECEIPT', 195, 24, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBlue);
  doc.text(`Receipt #: ${receiptNumber}`, 195, 29, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...secondarySlate);
  doc.text(`Issued: ${paymentDate}`, 195, 33.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(15, 38, 195, 38);

  // --- Status Banner Badge ---
  doc.setFillColor(...statusBadgeBg);
  doc.setDrawColor(...statusBadgeBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 42, 180, 9, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...statusBadgeText);
  doc.text(`OFFICIAL STATUS: ${statusText}`, 20, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Verified by NEST PMS`, 190, 48, { align: 'right' });

  // --- Details Cards: Tenant & Flat ---
  const cardY = 56;
  const cardHeight = 38;
  const colWidth = 88;

  // Left Card: Tenant Details
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(15, cardY, colWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandBlue);
  doc.text('TENANT INFORMATION', 20, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text(tenantName, 20, cardY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...secondarySlate);
  doc.text(`Phone: ${tenantPhone}`, 20, cardY + 20);
  doc.text(`CNIC: ${tenantCnic}`, 20, cardY + 25);
  doc.text(`Role: Verified Primary Resident`, 20, cardY + 30);

  // Right Card: Property Details
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(107, cardY, colWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandBlue);
  doc.text('PROPERTY & BILLING INFO', 112, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text(`Flat / Unit: ${flatNumber}`, 112, cardY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...secondarySlate);
  doc.text(`Address: ${flatAddress.slice(0, 38)}`, 112, cardY + 20);
  doc.text(`Billing Month: ${monthYear}`, 112, cardY + 25);
  doc.text(`Payment Method: ${paymentMethod}`, 112, cardY + 30);

  // --- Financial Ledger Table ---
  const tableY = 100;

  // Table Header
  doc.setFillColor(...primaryNavy);
  doc.rect(15, tableY, 180, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM DESCRIPTION', 20, tableY + 5.5);
  doc.text('BILLING PERIOD', 85, tableY + 5.5);
  doc.text('TOTAL RENT', 130, tableY + 5.5, { align: 'right' });
  doc.text('AMOUNT PAID', 162, tableY + 5.5, { align: 'right' });
  doc.text('BALANCE DUE', 190, tableY + 5.5, { align: 'right' });

  // Table Row 1: Rent
  const rowY = tableY + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.rect(15, rowY, 180, 12, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryNavy);
  doc.text(`Monthly Apartment Rent (${flatNumber})`, 20, rowY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedGray);
  doc.text(`Method: ${paymentMethod} • Date: ${paymentDate}`, 20, rowY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...secondarySlate);
  doc.text(monthYear, 85, rowY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text(`PKR ${totalAmount.toLocaleString()}`, 130, rowY + 7, { align: 'right' });

  doc.setTextColor(...(paidAmount > 0 ? [21, 128, 61] : secondarySlate));
  doc.text(`PKR ${paidAmount.toLocaleString()}`, 162, rowY + 7, { align: 'right' });

  doc.setTextColor(...(balanceDue > 0 ? [185, 28, 28] : [21, 128, 61]));
  doc.text(balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()}` : 'PKR 0', 190, rowY + 7, { align: 'right' });

  // --- Big Grand Total & Settlement Box ---
  const summaryY = 126;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(15, summaryY, 180, 36, 3, 3, 'FD');

  // Total Contractual Rent
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...secondarySlate);
  doc.text('Contractual Monthly Rent:', 22, summaryY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`PKR ${totalAmount.toLocaleString()}`, 90, summaryY + 9, { align: 'right' });

  // Total Amount Received (Highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryNavy);
  doc.text('Total Amount Received:', 22, summaryY + 18);

  doc.setFontSize(14);
  doc.setTextColor(...(paidAmount > 0 ? [21, 128, 61] : secondarySlate));
  doc.text(`PKR ${paidAmount.toLocaleString()}`, 90, summaryY + 18, { align: 'right' });

  // Remaining Balance Due (Highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryNavy);
  doc.text('Outstanding Rent Balance Due:', 22, summaryY + 27);

  doc.setFontSize(14);
  doc.setTextColor(...(balanceDue > 0 ? [217, 119, 6] : [21, 128, 61]));
  doc.text(balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()}` : 'PKR 0.00 (PAID)', 90, summaryY + 27, { align: 'right' });

  // Right Side of Summary Box: Verification Stamp
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(1);
  doc.roundedRect(120, summaryY + 5, 68, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isPaid ? 21 : (isPartial ? 180 : 185), isPaid ? 128 : (isPartial ? 83 : 28), isPaid ? 61 : (isPartial ? 9 : 28));
  doc.text(isPaid ? '★ VERIFIED PAID ★' : (isPartial ? '★ PARTIAL CONFIRMED ★' : '★ PAYMENT RECORD ★'), 154, summaryY + 14, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);
  doc.text(`Ref: ${receiptNumber}`, 154, summaryY + 19, { align: 'center' });
  doc.text(`Digital Seal: NEST-VERIFIED-AUTH`, 154, summaryY + 23, { align: 'center' });
  doc.text(`Issued by Owner Management System`, 154, summaryY + 27, { align: 'center' });

  // --- Terms & Notes ---
  const notesY = 168;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('TERMS & CONDITIONS:', 15, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondarySlate);
  doc.text('1. This digital rent receipt serves as conclusive legal evidence of payment received for the specified billing cycle.', 15, notesY + 5);
  doc.text('2. Payments are subject to clearance if settled via cheque or online inter-bank funds transfer.', 15, notesY + 9);
  doc.text('3. Any remaining balance due must be cleared as per the tenancy agreement schedule to avoid late surcharges.', 15, notesY + 13);
  doc.text('4. For billing inquiries or maintenance requests, please contact management via the NEST Mobile App.', 15, notesY + 17);

  // --- Signature Line & Footer ---
  const footerY = 200;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, 195, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('NEST PROPERTY MANAGEMENT', 15, footerY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mutedGray);
  doc.text('System Generated Official Invoice • No Physical Signature Required', 15, footerY + 10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 15, footerY + 14);

  // Signature box on right
  doc.setDrawColor(...secondarySlate);
  doc.setLineWidth(0.5);
  doc.line(140, footerY + 12, 195, footerY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('Authorized Property Manager', 167.5, footerY + 16, { align: 'center' });

  return doc;
}

/**
 * Generates and triggers automatic download of the PDF receipt in the browser and mobile devices.
 * @param {Object} receiptData
 * @param {string} filenamePrefix
 */
export async function downloadReceiptPdf(receiptData = {}, filenamePrefix = 'Rent_Receipt') {
  try {
    const doc = generateReceiptPdf(receiptData);
    const receiptNumber = receiptData.receipt_number || receiptData.receiptNumber || String(receiptData.id || Date.now());
    const cleanNum = String(receiptNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${filenamePrefix}_${cleanNum}.pdf`;

    // 1. Check if running inside React Native WebView (Expo Mobile App)
    if (typeof window !== 'undefined' && window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      const dataUri = doc.output('datauristring');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_PDF',
        filename,
        base64: dataUri
      }));
      return true;
    }

    // 2. Generate standard PDF Blob
    const blob = doc.output('blob');
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');

    // 3. Mobile Native Share API (Supported on Android Chrome & iOS Safari)
    if (isMobile && typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text: `Rent Receipt - ${receiptNumber}`
          });
          return true;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return true;
        }
        console.warn('Native share failed, falling back to direct download:', shareErr);
      }
    }

    // 4. Built-in jsPDF download
    try {
      doc.save(filename);
      return true;
    } catch (saveErr) {
      console.warn('doc.save failed, using DOM link fallback:', saveErr);
    }

    // 5. Robust Browser Download with DOM attachment fallback
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    }, 1500);

    return true;
  } catch (err) {
    console.error('Failed to download PDF receipt:', err);
    throw err;
  }
}
