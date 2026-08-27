import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  product?: { productName?: string; hsnCode?: string };
  productName?: string;
  hsnCode?: string;
  quantity?: number;
  price?: number;
  productDP?: number;
  amount?: number;
  gstAmount?: number;
  cgstRate?: number;
  sgstRate?: number;
  pv?: number;
}

interface InvoiceSale {
  saleNo: string;
  createdAt_IST?: string;
  saleDate: string;
  user?: {
    fullName?: string;
    memberId?: string;
    phone?: string;
    email?: string;
    address?: { country?: string; city?: string; state?: string };
  };
  memberId?: string;
  items: InvoiceItem[];
  subTotal?: number;
  gstAmount?: number;
  grandTotal: number;
  totalPV?: number;
  paymentMethod?: string;
}

const fmt = (n: number | undefined | null): string => {
  return parseFloat(String(n ?? 0)).toFixed(2);
};

export const generateInvoicePDF = (sale: InvoiceSale, franchiseName?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
  const pw = doc.internal.pageSize.getWidth();
  const m = 10;
  const fName = franchiseName || 'Franchise Store';

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  // ── Title ──
  const titleY = m;
  doc.rect(m, titleY, pw - 2 * m, 10);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GST INVOICE', pw / 2, titleY + 7, { align: 'center' });

  // ── Header Info (Left only, no transport block) ──
  const hY = titleY + 10;
  const hH = 22;
  doc.rect(m, hY, pw - 2 * m, hH);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let ly = hY + 5;
  doc.text('GST No: 19ABRCS5991B1ZQ', m + 3, ly);
  ly += 4;
  doc.text('Tax is payable on Reverse Charge: No', m + 3, ly);
  ly += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No: ' + sale.saleNo, m + 3, ly);
  doc.setFont('helvetica', 'normal');
  ly += 4;
  const dateStr = sale.createdAt_IST || new Date(sale.saleDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  doc.text('Date: ' + dateStr, m + 3, ly);

  // ── Parties Section (side-by-side) ──
  const pY = hY + hH;
  const pH2 = 26;
  const midX = pw / 2;
  doc.rect(m, pY, midX - m, pH2);
  doc.rect(midX, pY, pw - m - midX, pH2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Billed To:', m + 3, pY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: ' + (sale.user?.fullName || 'N/A'), m + 3, pY + 10);
  const addr = [sale.user?.address?.city, sale.user?.address?.state, sale.user?.address?.country || 'India'].filter(Boolean).join(', ');
  doc.text('Address: ' + addr, m + 3, pY + 14);
  doc.text('Contact: ' + (sale.user?.phone || 'N/A'), m + 3, pY + 18);
  doc.text('Member ID: ' + (sale.user?.memberId || sale.memberId || 'N/A'), m + 3, pY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Sold By:', midX + 3, pY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: ' + fName, midX + 3, pY + 10);
  doc.text('Address: India', midX + 3, pY + 14);

  // ── Items Table ──
  const tableStartY = pY + pH2 + 2;

  let totalCGST = 0;
  let totalSGST = 0;

  const tableBody = sale.items.map((item, i) => {
    const qty = item.quantity ?? 0;
    const rate = item.price ?? 0;
    const taxableValue = item.amount ?? (qty * rate);
    const cgstRate = item.cgstRate ?? 0;
    const sgstRate = item.sgstRate ?? 0;
    const cgstAmt = (taxableValue * cgstRate) / 100;
    const sgstAmt = (taxableValue * sgstRate) / 100;

    totalCGST += cgstAmt;
    totalSGST += sgstAmt;

    return [
      String(i + 1),
      item.product?.productName || item.productName || 'N/A',
      item.hsnCode || item.product?.hsnCode || '-',
      String(qty),
      fmt(rate),
      fmt(taxableValue),
      `${cgstRate}% (${fmt(cgstAmt)})`,
      `${sgstRate}% (${fmt(sgstAmt)})`,
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['Sl', 'Description of Goods', 'HSN', 'QTY', 'Rate', 'Total', 'CGST', 'SGST']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 7, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 7 },
    styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.3, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
    },
  });

  // ── Totals ──
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;

  const summaryData: [string, string][] = [
    ['Gross Total:', fmt(sale.subTotal ?? sale.grandTotal)],
    ['Total CGST:', fmt(totalCGST)],
    ['Total SGST:', fmt(totalSGST)],
    ['Grand Total:', fmt(sale.grandTotal)],
  ];

  const sLineH = 5;
  const sBoxW = 70;
  const sBoxX = pw - m - sBoxW;
  let sy = finalY + 4;
  const sBoxH = summaryData.length * sLineH + 4;
  doc.rect(sBoxX, sy, sBoxW, sBoxH);

  doc.setFontSize(8);
  summaryData.forEach(([label, val], idx) => {
    const yPos = sy + 4 + idx * sLineH;
    const isBold = label === 'Grand Total:';
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label, sBoxX + 3, yPos);
    doc.text(val, pw - m - 3, yPos, { align: 'right' });
  });

  // ── Signature Block ──
  const sigY = sy + sBoxH + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('For ' + fName, pw - m - 5, sigY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.line(pw - m - 50, sigY + 12, pw - m, sigY + 12);
  doc.text('Authorised Signature', pw - m - 25, sigY + 16, { align: 'center' });

  doc.save('Invoice_' + sale.saleNo + '.pdf');
};
