import * as XLSX from 'xlsx';
import { Product, ProductBatch } from '../types';
import { formatGst } from './gstHelper';

export { formatGst };

export interface ParsedProductRow {
  name: string;
  genericName: string;
  packaging: string;
  form: string;
  mrp: number;
  pricingToStockist?: number;
  pricingToRetailer?: number;
  sellingRate?: number;
  purchasePrice?: number;
  gst?: string | number;
  company: string;
  stockUnits: number;
  batchNo: string;
  expiryDate: string;
  batches: ProductBatch[];
  category?: string;
  clinicalSpeciality?: string;
  reorderLevel?: number;
  isHighDemand?: boolean;
}

export interface ExcelImportResult {
  products: ParsedProductRow[];
  errors: string[];
  totalRowsProcessed: number;
}

// Map column header aliases
const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const parseExcelFile = async (file: File): Promise<ExcelImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // First sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            products: [],
            errors: ['The uploaded spreadsheet is empty.'],
            totalRowsProcessed: 0
          });
          return;
        }

        const errors: string[] = [];
        const productMap = new Map<string, ParsedProductRow>();

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1

          // Find values by fuzzy header match
          let productName = '';
          let saltName = '';
          let packaging = '';
          let dosageForm = '';
          let mrp = 0;
          let pricingToStockist: number | undefined = undefined;
          let pricingToRetailer: number | undefined = undefined;
          let sellingPrice: number | undefined = undefined;
          let purchasePrice: number | undefined = undefined;
          let gst: string | number = '12%';
          let company = '';
          let categoryInput: string | undefined = undefined;
          let clinicalSpecialityInput: string | undefined = undefined;
          let stock = 0;
          let batchNo = '';
          let expiry = '';
          let reorderLevel: number | undefined = undefined;
          let isHighDemand: boolean | undefined = undefined;

          // Loop row keys
          Object.keys(row).forEach((k) => {
            const normalized = normalizeHeader(k);
            const val = row[k];
            const rawStr = val !== undefined && val !== null ? String(val).trim() : '';
            const isCellBlank =
              rawStr === '' ||
              rawStr === '-' ||
              rawStr === '--' ||
              rawStr.toLowerCase() === 'n/a' ||
              rawStr.toLowerCase() === 'na' ||
              rawStr.toLowerCase() === 'null' ||
              rawStr.toLowerCase() === 'none' ||
              rawStr.toLowerCase() === 'nil';

            if (normalized.includes('product') || normalized.includes('brand') || normalized === 'name' || normalized === 'item') {
              productName = String(val).trim();
            } else if (normalized.includes('salt') || normalized.includes('composition') || normalized.includes('generic')) {
              saltName = String(val).trim();
            } else if (normalized.includes('pack') || normalized.includes('packaging')) {
              packaging = String(val).trim();
            } else if (normalized.includes('dosage') || normalized.includes('form')) {
              dosageForm = String(val).trim();
            } else if (
              normalized.includes('stockist') ||
              normalized === 'pts' ||
              normalized.includes('pricetostockist') ||
              normalized.includes('pricingtostockist') ||
              normalized.includes('ratetostockist')
            ) {
              // Only fill if entered explicitly by admin and not blank
              if (!isCellBlank) {
                const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
                if (!isNaN(num) && num > 0) {
                  pricingToStockist = num;
                }
              }
            } else if (
              normalized.includes('retailer') ||
              normalized === 'ptr' ||
              normalized.includes('pricetoretailer') ||
              normalized.includes('pricingtoretailer') ||
              normalized.includes('ratetoretailer')
            ) {
              // Only fill if entered explicitly by admin and not blank
              if (!isCellBlank) {
                const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
                if (!isNaN(num) && num > 0) {
                  pricingToRetailer = num;
                }
              }
            } else if (normalized.includes('mrp')) {
              if (!isCellBlank) {
                const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
                mrp = isNaN(num) ? 0 : num;
              }
            } else if (normalized.includes('selling') || normalized.includes('reprate') || normalized.includes('repprice')) {
              // Only fill if entered explicitly by admin and not blank
              if (!isCellBlank) {
                const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
                if (!isNaN(num) && num > 0) {
                  sellingPrice = num;
                }
              }
            } else if (normalized.includes('purchase') || normalized.includes('cost') || normalized.includes('buying')) {
              if (!isCellBlank) {
                const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
                purchasePrice = isNaN(num) || num <= 0 ? undefined : num;
              }
            } else if (normalized.includes('gst') || normalized.includes('tax')) {
              if (!isCellBlank) {
                gst = formatGst(rawStr);
              }
            } else if (normalized.includes('company') || normalized.includes('manufacturer') || normalized.includes('mfg') || normalized.includes('maker') || normalized.includes('pharma') || normalized.includes('brandowner')) {
              if (!isCellBlank) {
                company = rawStr;
              }
            } else if (
              normalized.includes('clinicalspeciality') ||
              normalized.includes('clinicalspecialty') ||
              normalized.includes('division') ||
              normalized.includes('medicalspeciality') ||
              normalized.includes('targetspeciality') ||
              normalized.includes('pediatric') ||
              normalized.includes('paediatric') ||
              normalized.includes('gynaecology') ||
              normalized.includes('gynecology')
            ) {
              if (!isCellBlank && rawStr.length > 0) {
                clinicalSpecialityInput = rawStr;
              }
            } else if (
              normalized.includes('category') ||
              normalized.includes('therapeutic') ||
              normalized.includes('speciality') ||
              normalized.includes('specialty') ||
              normalized.includes('segment') ||
              normalized === 'cat'
            ) {
              // STRICT RULE: Only fill if explicitly entered by admin. If blank, keep as undefined!
              if (!isCellBlank && rawStr.length > 0) {
                categoryInput = rawStr;
              }
            } else if (normalized.includes('reorder') || normalized.includes('reorderlevel') || normalized.includes('safetystock')) {
              if (!isCellBlank) {
                const num = parseInt(rawStr.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(num) && num > 0) {
                  reorderLevel = num;
                }
              }
            } else if (normalized.includes('highdemand') || normalized.includes('fastmoving') || normalized.includes('velocity')) {
              if (!isCellBlank) {
                const lower = rawStr.toLowerCase();
                isHighDemand = lower === 'yes' || lower === 'true' || lower === '1' || lower === 'high' || lower === 'y';
              }
            } else if (normalized.includes('stock') || normalized.includes('qty') || normalized.includes('quantity')) {
              const num = parseInt(rawStr.replace(/[^0-9]/g, ''), 10);
              stock = isNaN(num) ? 0 : num;
            } else if (normalized.includes('batch') || normalized.includes('lot')) {
              batchNo = rawStr;
            } else if (normalized.includes('exp') || normalized.includes('expiry')) {
              // Handle Excel date object or string
              if (val instanceof Date) {
                const month = String(val.getMonth() + 1).padStart(2, '0');
                const year = val.getFullYear();
                expiry = `${month}/${year}`;
              } else {
                expiry = rawStr;
              }
            }
          });

          // Validation
          if (!productName) {
            errors.push(`Row ${rowNum}: Skipped because Product Name is missing.`);
            return;
          }

          // Format fallback defaults (for physical packaging/batch metadata only)
          if (!dosageForm) dosageForm = 'Tablet';
          if (!packaging) packaging = '10x10 Strip';
          if (!saltName) saltName = productName;
          if (!stock) stock = 1000;
          if (!batchNo) batchNo = 'STD-BATCH';
          if (!expiry) expiry = '12/2028';
          
          // STRICT RULE: Do NOT auto-compute or auto-assign sellingPrice, purchasePrice, pricingToStockist, pricingToRetailer, or Category!
          // Leave blank on the output if kept blank by the admin in Excel!
          const finalCategory = categoryInput !== undefined && categoryInput.trim().length > 0 ? categoryInput.trim() : undefined;
          const finalClinicalSpeciality = clinicalSpecialityInput !== undefined && clinicalSpecialityInput.trim().length > 0 ? clinicalSpecialityInput.trim() : undefined;

          // Parse multiple batches in column if comma/semicolon/pipe separated
          const rawBatchList = batchNo.split(/[,;\n|]+/).map((b) => b.trim()).filter(Boolean);
          const rawExpList = expiry.split(/[,;\n|]+/).map((e) => e.trim()).filter(Boolean);

          const parsedBatches: ProductBatch[] = [];
          if (rawBatchList.length > 1) {
            rawBatchList.forEach((b, i) => {
              parsedBatches.push({
                batchNumber: b,
                expiryDate: rawExpList[i] || rawExpList[0] || '12/2027',
                stock: Math.round(stock / rawBatchList.length)
              });
            });
          } else {
            parsedBatches.push({
              batchNumber: batchNo,
              expiryDate: expiry,
              stock: stock
            });
          }

          // Multi-row merge for same product name
          const key = productName.toLowerCase().trim();
          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            // Add new batches
            existing.batches.push(...parsedBatches);
            // Append batch string
            existing.batchNo = `${existing.batchNo}, ${batchNo}`;
            existing.stockUnits += stock;
            // Only update fields if explicitly provided in this row
            if (mrp > 0) existing.mrp = mrp;
            if (pricingToStockist !== undefined) existing.pricingToStockist = pricingToStockist;
            if (pricingToRetailer !== undefined) existing.pricingToRetailer = pricingToRetailer;
            if (sellingPrice !== undefined) existing.sellingRate = sellingPrice;
            if (purchasePrice !== undefined) existing.purchasePrice = purchasePrice;
            if (company) existing.company = company;
            if (finalCategory) existing.category = finalCategory;
            if (finalClinicalSpeciality) existing.clinicalSpeciality = finalClinicalSpeciality;
            if (reorderLevel !== undefined) existing.reorderLevel = reorderLevel;
            if (isHighDemand !== undefined) existing.isHighDemand = isHighDemand;
          } else {
            productMap.set(key, {
              name: productName,
              genericName: saltName,
              packaging: packaging,
              form: dosageForm,
              mrp: mrp,
              pricingToStockist: pricingToStockist,
              pricingToRetailer: pricingToRetailer,
              sellingRate: sellingPrice,
              purchasePrice: purchasePrice,
              gst: gst,
              company: company || 'DDB DRUG CHEM',
              stockUnits: stock,
              batchNo: batchNo,
              expiryDate: expiry,
              batches: parsedBatches,
              category: finalCategory,
              clinicalSpeciality: finalClinicalSpeciality,
              reorderLevel: reorderLevel,
              isHighDemand: isHighDemand
            });
          }
        });

        resolve({
          products: Array.from(productMap.values()),
          errors: errors,
          totalRowsProcessed: rawJson.length
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Generate and trigger download of template with exact 12 columns (including Pricing to Stockist and Pricing to Retailer)
export const downloadExcelTemplate = () => {
  const headers = [
    'Product Name',
    'Salt Name/ Composition',
    'Packaging',
    'Dosage form',
    'MRP',
    'Pricing to Stockist',
    'Pricing to Retailer',
    'Selling Price',
    'Purchase Price',
    'GST',
    'Company',
    'Category',
    'Clinical Speciality'
  ];

  const sampleRows = [
    [
      'TelmiKard 40-H',
      'Telmisartan 40mg + Hydrochlorothiazide 12.5mg',
      '10x10 Tablets',
      'Tablet',
      210.0,
      138.0,
      148.0,
      158.0,
      125.0,
      '12%',
      'Torrent Pharmaceuticals',
      'Cardiology',
      'Cardiology'
    ],
    [
      'AmoxyClav 625 Duo',
      'Amoxicillin 500mg + Potassium Clavulanate 125mg',
      '1x10 Strip',
      'Tablet',
      228.5,
      152.0,
      162.0,
      172.0,
      138.0,
      '12%',
      'Alkem Laboratories',
      'Antibiotics',
      'Paediatric'
    ],
    [
      'Pantocid DSR',
      'Pantoprazole 40mg + Domperidone 30mg SR',
      '10x10 Capsules',
      'Capsule',
      195.0,
      128.0,
      136.0,
      145.0,
      115.0,
      '12%',
      'Sun Pharma Ltd',
      'Gastroenterology',
      'General Medicine'
    ],
    [
      'Montair-LC',
      'Montelukast 10mg + Levocetirizine 5mg',
      '10x10 Tablets',
      'Tablet',
      185.0,
      120.0,
      128.0,
      138.0,
      108.0,
      '12%',
      'Cipla Ltd',
      'Respiratory',
      'Paediatric'
    ],
    [
      'Cefix-O 200',
      'Cefixime 200mg + Ofloxacin 200mg',
      '10x10 Tablets',
      'Tablet',
      245.0,
      162.0,
      174.0,
      185.0,
      148.0,
      '12%',
      'Mankind Pharma Ltd',
      'Antibiotics',
      'Gynaecology'
    ],
    [
      'Dolokard-SP',
      'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
      '10x10 Tablets',
      'Tablet',
      135.0,
      86.0,
      92.0,
      98.0,
      74.0,
      '12%',
      'Mankind Pharma Ltd',
      'Analgesics',
      'Orthopaedics'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths for the 13 columns
  ws['!cols'] = [
    { wch: 22 }, // 1. Product Name
    { wch: 45 }, // 2. Salt Name/ Composition
    { wch: 18 }, // 3. Packaging
    { wch: 14 }, // 4. Dosage form
    { wch: 12 }, // 5. MRP
    { wch: 18 }, // 6. Pricing to Stockist
    { wch: 18 }, // 7. Pricing to Retailer
    { wch: 14 }, // 8. Selling Price
    { wch: 14 }, // 9. Purchase Price
    { wch: 10 }, // 10. GST
    { wch: 26 }, // 11. Company
    { wch: 18 }, // 12. Category
    { wch: 22 }  // 13. Clinical Speciality
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  XLSX.writeFile(wb, 'DDB_DRUG_CHEM_Product_Catalogue_Template.xlsx');
};

/**
 * Export an array of Products to an Excel spreadsheet file (.xlsx)
 */
export const exportProductsToExcel = (
  productsToExport: Product[],
  filename: string = 'DDB_DRUG_CHEM_Products_Export.xlsx'
) => {
  const headers = [
    'Product Name',
    'Salt Name / Composition',
    'Packaging',
    'Dosage form',
    'MRP',
    'Pricing to Stockist',
    'Pricing to Retailer',
    'Selling Price',
    'Purchase Price',
    'GST',
    'Company',
    'Category',
    'Clinical Speciality'
  ];

  const rows = productsToExport.map((p) => [
    p.name,
    p.genericName || p.name,
    p.packaging || '10x10 Tablets',
    p.form || 'Tablet',
    Number(p.mrp) || 0,
    p.pricingToStockist !== undefined && p.pricingToStockist !== null && Number(p.pricingToStockist) > 0
      ? Number(p.pricingToStockist)
      : '',
    p.pricingToRetailer !== undefined && p.pricingToRetailer !== null && Number(p.pricingToRetailer) > 0
      ? Number(p.pricingToRetailer)
      : '',
    p.sellingRate !== undefined && p.sellingRate !== null && Number(p.sellingRate) > 0
      ? Number(p.sellingRate)
      : '',
    p.purchasePrice !== undefined && p.purchasePrice !== null && Number(p.purchasePrice) > 0
      ? Number(p.purchasePrice)
      : '',
    formatGst(p.gst),
    p.company || 'DDB DRUG CHEM',
    p.category && p.category.trim() && p.category.trim() !== '-' ? p.category.trim() : '',
    p.clinicalSpeciality && p.clinicalSpeciality.trim() && p.clinicalSpeciality.trim() !== '-' ? p.clinicalSpeciality.trim() : ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = [
    { wch: 24 }, // Product Name
    { wch: 45 }, // Salt Name
    { wch: 18 }, // Packaging
    { wch: 14 }, // Dosage form
    { wch: 12 }, // MRP
    { wch: 18 }, // Pricing to Stockist
    { wch: 18 }, // Pricing to Retailer
    { wch: 14 }, // Selling Price
    { wch: 14 }, // Purchase Price
    { wch: 10 }, // GST
    { wch: 26 }, // Company
    { wch: 18 }, // Category
    { wch: 22 }  // Clinical Speciality
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catalog Formulations');
  XLSX.writeFile(wb, filename);
};

