import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentTransaction, Organization } from '../types';

/**
 * Generates and downloads a formal pharmaceutical SaaS tax invoice PDF file for an individual transaction.
 */
export function downloadInvoicePDF(
  transaction: PaymentTransaction,
  organization?: Organization
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const baseAmount = Math.round(transaction.amount / 1.18);
  const totalTax = transaction.amount - baseAmount;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  const invoiceDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // 1. Top Decorative Brand Bar
  doc.setFillColor(37, 99, 235); // #2563eb Blue
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Company Brand & Issuer Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('DDB DRUG CHEM', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('DDB Pharma Life Sciences Pvt. Ltd. | SaaS Cloud Platform', 14, 23);
  doc.text('Commercial Tower, 4th Floor, BKC, Mumbai - 400051, Maharashtra, India', 14, 27);
  doc.text('GSTIN: 27AAACN0000A1Z5  |  PAN: AAACN0000A  |  Drug Lic: DL-20B/21B-MH-MUM-2026-001', 14, 31);
  doc.text('Email: billing@ddbdrugchem.com  |  SAC Code: 998313 (Cloud Computing & SaaS)', 14, 35);

  // 3. Invoice Header Badge (Right Side)
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(pageWidth - 75, 12, 61, 25, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('TAX INVOICE', pageWidth - 70, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(transaction.invoiceNumber, pageWidth - 70, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${invoiceDate}`, pageWidth - 70, 29);

  // Status Badge
  if (transaction.status === 'succeeded') {
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text('Status: PAID (SUCCEEDED)', pageWidth - 70, 33);
  } else if (transaction.status === 'pending') {
    doc.setTextColor(161, 98, 7); // amber-700
    doc.text('Status: PAYMENT PENDING', pageWidth - 70, 33);
  } else {
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('Status: PAYMENT FAILED', pageWidth - 70, 33);
  }

  // Horizontal Separator
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 41, pageWidth - 14, 41);

  // 4. Two-Column Metadata Box (Billed To & Subscription Details)
  const boxTop = 46;
  const colWidth = (pageWidth - 34) / 2;

  // Box 1: Billed To
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, boxTop, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO / SUBSCRIBER:', 18, boxTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.organizationName, 18, boxTop + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(organization?.legalName || `${transaction.organizationName} Pvt. Ltd.`, 18, boxTop + 17);
  doc.text(`Billing Email: ${transaction.customerEmail}`, 18, boxTop + 22);
  doc.text(`GSTIN / Tax ID: ${organization?.gstin || '27AAACN0000A1Z5'}`, 18, boxTop + 27);
  doc.text(`State / Territory: ${organization?.state || 'Maharashtra'}, India`, 18, boxTop + 32);

  // Box 2: Payment Gateway & Subscription
  const col2X = 14 + colWidth + 6;
  doc.roundedRect(col2X, boxTop, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT & SUBSCRIPTION DETAILS:', col2X + 4, boxTop + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tenant Partition ID: ${transaction.tenantId}`, col2X + 4, boxTop + 12);
  doc.text(`Subscription Plan: ${transaction.planName} (${transaction.billingCycle.toUpperCase()})`, col2X + 4, boxTop + 17);
  doc.text(`Card Charged: ${transaction.paymentMethod.brand.toUpperCase()} **** ${transaction.paymentMethod.last4}`, col2X + 4, boxTop + 22);
  doc.text(`Gateway: Stripe Payments (PCI-DSS Level 1)`, col2X + 4, boxTop + 27);
  doc.text(`Stripe Payment Intent: ${transaction.stripePaymentIntentId.slice(0, 24)}...`, col2X + 4, boxTop + 32);

  // 5. Line Items Table using autoTable
  autoTable(doc, {
    startY: 90,
    head: [['#', 'Item & Description', 'SAC Code', 'Cycle', 'Taxable Value (INR)']],
    body: [
      [
        '1',
        `Pharma SaaS Cloud Platform — ${transaction.planName} Tier\nCapacity: ${transaction.planId === 'enterprise' ? '50' : transaction.planId === 'professional' ? '20' : '8'} Reps, GPS geo-fence tracking, doctor detailing & direct chemist invoicing`,
        '998313',
        transaction.billingCycle.toUpperCase(),
        `INR ${baseAmount.toLocaleString('en-IN')}`
      ]
    ],
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 105 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
    },
    theme: 'striped',
    margin: { left: 14, right: 14 }
  });

  // 6. Tax Breakdown & Total Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  const summaryBoxX = pageWidth - 84;
  const summaryY = finalY + 8;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(summaryBoxX, summaryY, 70, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Taxable Subtotal:', summaryBoxX + 4, summaryY + 7);
  doc.text(`INR ${baseAmount.toLocaleString('en-IN')}`, summaryBoxX + 66, summaryY + 7, { align: 'right' });

  doc.text('Central GST (CGST 9%):', summaryBoxX + 4, summaryY + 13);
  doc.text(`INR ${cgst.toLocaleString('en-IN')}`, summaryBoxX + 66, summaryY + 13, { align: 'right' });

  doc.text('State GST (SGST 9%):', summaryBoxX + 4, summaryY + 19);
  doc.text(`INR ${sgst.toLocaleString('en-IN')}`, summaryBoxX + 66, summaryY + 19, { align: 'right' });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(summaryBoxX + 4, summaryY + 22, summaryBoxX + 66, summaryY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Amount Paid:', summaryBoxX + 4, summaryY + 29);

  doc.setTextColor(37, 99, 235);
  doc.text(`INR ${transaction.amount.toLocaleString('en-IN')}`, summaryBoxX + 66, summaryY + 29, { align: 'right' });

  // 7. Amount in Words & Notes (Left Side of Summary)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TERMS & PAYMENT AUTHORIZATION:', 14, summaryY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Subscription services are billed in advance per billing cycle.', 14, summaryY + 13);
  doc.text('2. Payments are authorized via Stripe Payments India Pvt. Ltd. / Stripe Inc.', 14, summaryY + 18);
  doc.text('3. Reverse charge does not apply. GST collected at standard 18% SaaS rate.', 14, summaryY + 23);
  doc.text('4. For tax queries, contact billing@ddbdrugchem.com quoting this invoice number.', 14, summaryY + 28);

  // 8. Signatory & Regulatory Footer
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'This is a digitally generated tax invoice authorized by DDB Pharma Life Sciences Pvt. Ltd. No physical signature is required under IT Act 2000.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.text(
    `Page 1 of 1  |  Generated on ${new Date().toLocaleDateString('en-IN')}  |  Ref: ${transaction.stripePaymentIntentId}`,
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );

  const cleanOrgName = (organization?.name || transaction.organizationName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${transaction.invoiceNumber}_${cleanOrgName}.pdf`;

  // Trigger browser download
  doc.save(filename);
  return filename;
}
