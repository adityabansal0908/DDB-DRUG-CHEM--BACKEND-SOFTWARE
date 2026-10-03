import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesRep, OrderOrSampleRequest, FieldVisit } from '../types';

interface ProductContribution {
  name: string;
  category: string;
  qty: number;
  revenue: number;
}

interface GenerateReportPDFParams {
  selectedRep: SalesRep | null;
  dateRangeLabel: string;
  metrics: {
    totalGrossRevenue: number;
    approvedOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: number;
    totalVisitsCount: number;
    totalSamplesGiven: number;
    conversionRate: number;
    quotaAchievementRate: number;
  };
  orders: OrderOrSampleRequest[];
  visits: FieldVisit[];
  productContributions: ProductContribution[];
}

export function generateSalesRepReportPDF({
  selectedRep,
  dateRangeLabel,
  metrics,
  orders,
  visits,
  productContributions
}: GenerateReportPDFParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const primaryColor: [number, number, number] = [30, 58, 138]; // Deep Blue
  const secondaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentEmerald: [number, number, number] = [5, 150, 105]; // Emerald
  const borderGrey: [number, number, number] = [226, 232, 240];

  // Helper for Section Titles
  const addSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(title, margin + 3, yPos + 4.8);
    return yPos + 10;
  };

  // --- HEADER / LETTERHEAD ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let currentY = 14;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...secondaryColor);
  doc.text('DDB DRUG CHEM & PHARMACEUTICALS', margin, currentY);

  // Subtitle
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Territory Sales Operations & Representative Field Performance Audit', margin, currentY);

  // Right-aligned Generation Date
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const genDateStr = `Generated: ${new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(genDateStr, pageWidth - margin, 14, { align: 'right' });

  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3);

  currentY += 8;

  // --- REPORT SCOPE METADATA BOX ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Representative:', margin + 4, currentY + 5.5);
  doc.text('Territory:', margin + 4, currentY + 11);
  doc.text('Reporting Window:', margin + 4, currentY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text(
    selectedRep ? `${selectedRep.name} (${selectedRep.employeeCode})` : 'All Medical Representatives (Consolidated)',
    margin + 34,
    currentY + 5.5
  );
  doc.setFont('helvetica', 'normal');
  doc.text(selectedRep ? selectedRep.territory : 'Pan-Territory Medical Coverage', margin + 34, currentY + 11);
  doc.text(dateRangeLabel, margin + 34, currentY + 16.5);

  currentY += 24;

  // --- EXECUTIVE SUMMARY KPI TABLE ---
  currentY = addSectionHeader('1. EXECUTIVE SALES PERFORMANCE METRICS', currentY);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold'
    },
    body: [
      [
        { content: 'Gross Sales Booked:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `₹${metrics.totalGrossRevenue.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
        { content: 'Quota Achievement:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        {
          content: `${metrics.quotaAchievementRate}%`,
          styles: { fontStyle: 'bold', textColor: metrics.quotaAchievementRate >= 100 ? [5, 150, 105] : [217, 119, 6] }
        }
      ],
      [
        { content: 'Orders Approved / Total:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${metrics.approvedOrdersCount} approved (${metrics.totalOrdersCount} total)`, styles: { textColor: [15, 23, 42] } },
        { content: 'Average Order Value (AOV):', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `₹${metrics.averageOrderValue.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } }
      ],
      [
        { content: 'Doctor Visits Completed:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${metrics.totalVisitsCount} verified visits`, styles: { textColor: [15, 23, 42] } },
        { content: 'Sample Units Issued:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${metrics.totalSamplesGiven} clinical units`, styles: { textColor: [15, 23, 42] } }
      ],
      [
        { content: 'Visit-to-Order Conversion:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${metrics.conversionRate}% conversion rate`, styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
        { content: 'Audit Status:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: 'GPS Location & Timestamp Verified', styles: { fontStyle: 'italic', textColor: [100, 116, 139] } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- SECTION 2: TOP PRODUCT CONTRIBUTIONS ---
  currentY = addSectionHeader('2. TOP FORMULATIONS & THERAPEUTIC SPECIALITY CONTRIBUTION', currentY);

  const topProducts = productContributions.slice(0, 7);
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    head: [['Formulation Name', 'Therapeutic Category', 'Qty Booked', 'Total Revenue (INR)', 'Revenue Share']],
    body: topProducts.length > 0
      ? topProducts.map(p => {
          const share = metrics.totalGrossRevenue > 0
            ? `${((p.revenue / metrics.totalGrossRevenue) * 100).toFixed(1)}%`
            : '0%';
          return [
            p.name,
            p.category || 'General',
            String(p.qty),
            `₹${p.revenue.toLocaleString('en-IN')}`,
            share
          ];
        })
      : [['No product sales data in selected range', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a page break before Section 3
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  // --- SECTION 3: RECENT BOOKED ORDERS LEDGER ---
  currentY = addSectionHeader('3. ITEMIZED ORDERS & DISPATCH PIPELINE', currentY);

  const tableOrders = orders.slice(0, 15);
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    head: [['Order ID', 'Date', 'Representative', 'Physician / Counter', 'Formulations', 'Amount (INR)', 'Status']],
    body: tableOrders.length > 0
      ? tableOrders.map(o => {
          const itemsSummary = o.items?.map(it => `${it.productName} (x${it.qty})`).join(', ') || 'N/A';
          return [
            o.id,
            o.date,
            o.repName.split(' ')[0],
            o.doctorName,
            itemsSummary.length > 36 ? itemsSummary.slice(0, 34) + '...' : itemsSummary,
            `₹${o.totalAmount.toLocaleString('en-IN')}`,
            o.status.toUpperCase()
          ];
        })
      : [['No orders booked in selected window', '-', '-', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a page break before Section 4
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  // --- SECTION 4: DOCTOR VISITS SUMMARY ---
  currentY = addSectionHeader('4. DOCTOR VISITS & CLINICAL DETAILING LOG', currentY);

  const tableVisits = visits.slice(0, 12);
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    head: [['Visit ID', 'Date / Time', 'Rep', 'Doctor & Specialty', 'Purpose', 'Samples', 'GPS Verified']],
    body: tableVisits.length > 0
      ? tableVisits.map(v => [
          v.id,
          v.timestamp.length > 18 ? v.timestamp.slice(0, 18) : v.timestamp,
          v.repName.split(' ')[0],
          `${v.doctorName} (${v.specialty})`,
          v.purpose,
          String(v.sampleUnitsGiven || 0),
          v.locationVerified ? 'VERIFIED' : 'PENDING'
        ])
      : [['No visits recorded in this period', '-', '-', '-', '-', '-', '-']]
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    // Left disclaimer
    doc.text(
      'DDB DRUG CHEM & PHARMACEUTICALS • STRICTLY CONFIDENTIAL INTERNAL AUDIT',
      margin,
      pageHeight - 6
    );

    // Right Page numbering
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}
