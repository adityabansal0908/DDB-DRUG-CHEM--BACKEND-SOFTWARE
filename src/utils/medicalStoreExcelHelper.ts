import * as XLSX from 'xlsx';
import { RetailCounter } from '../types';

export interface ParsedMedicalStoreRow {
  name: string;
  type: RetailCounter['type'];
  contactPerson: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  territory: string;
  assignedRepName?: string;
  assignedRepId?: string;
  drugLicenseNo: string;
  gstin: string;
  hospitalName?: string;
  clinicName?: string;
  linkedDoctorNames?: string[];
  creditDays: number;
  creditLimit: number;
  directDiscountPct: number;
  preferredPaymentTerms: string;
  notes?: string;
  status: RetailCounter['status'];
}

export interface MedicalStoreExcelImportResult {
  stores: ParsedMedicalStoreRow[];
  errors: string[];
  totalRowsProcessed: number;
}

const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Normalizes user-entered store type strings into validated enum
 */
export const normalizeStoreType = (raw: string): RetailCounter['type'] => {
  if (!raw || !raw.trim()) return 'retail_chemist';
  const s = raw.toLowerCase().trim();

  if (s.includes('wholesale') || s.includes('stockist') || s.includes('distributor') || s.includes('b2b')) {
    return 'wholesale_chemist';
  }
  if (s.includes('hospital') || s.includes('institutional') || s.includes('inpatient')) {
    return 'hospital_pharmacy';
  }
  if (s.includes('clinic') || s.includes('chamber') || s.includes('dispensary') || s.includes('attached')) {
    return 'clinic_counter';
  }
  if (s.includes('chain') || s.includes('depot') || s.includes('hub') || s.includes('warehouse')) {
    return 'chain_pharmacy';
  }
  return 'retail_chemist';
};

/**
 * Normalizes account status string
 */
export const normalizeStoreStatus = (raw: string): RetailCounter['status'] => {
  if (!raw || !raw.trim()) return 'active';
  const s = raw.toLowerCase().trim();
  if (s.includes('high') || s.includes('volume') || s.includes('vip') || s.includes('priority')) {
    return 'high_volume';
  }
  if (s.includes('refill') || s.includes('pending') || s.includes('due')) {
    return 'pending_refill';
  }
  return 'active';
};

/**
 * Parses user-uploaded Excel workbook for bulk medical stores import
 */
export const parseMedicalStoreExcelFile = async (file: File): Promise<MedicalStoreExcelImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          resolve({
            stores: [],
            errors: ['The uploaded workbook has no readable sheets.'],
            totalRowsProcessed: 0
          });
          return;
        }

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          resolve({
            stores: [],
            errors: ['No data rows found in the sheet. Please ensure headers are in Row 1 and store records begin in Row 2.'],
            totalRowsProcessed: 0
          });
          return;
        }

        const headerRow: string[] = rawJson[0] || [];
        const normHeaders = headerRow.map((h) => normalizeHeader(String(h || '')));

        const findColIdx = (...candidates: string[]): number => {
          for (const cand of candidates) {
            const exactIdx = normHeaders.indexOf(cand);
            if (exactIdx !== -1) return exactIdx;
          }
          for (const cand of candidates) {
            const fuzzyIdx = normHeaders.findIndex((h) => h.includes(cand));
            if (fuzzyIdx !== -1) return fuzzyIdx;
          }
          return -1;
        };

        const idxName = findColIdx('storename', 'medicalstore', 'chemistname', 'store', 'shopname');
        const idxType = findColIdx('storetype', 'type', 'category', 'channel');
        const idxHospital = findColIdx('hospitalname', 'hospital', 'institution');
        const idxClinic = findColIdx('clinicname', 'clinic', 'chamber');
        const idxDoctor = findColIdx('doctor', 'doctorsname', 'prescribingdoctor', 'physician', 'linkeddoctor');
        const idxContact = findColIdx('contactperson', 'contact', 'pharmacist', 'owner', 'manager');
        const idxPhone = findColIdx('phone', 'phonenumber', 'mobile', 'whatsapp', 'contactnumber');
        const idxAddress = findColIdx('address', 'storeaddress', 'street', 'location');
        const idxArea = findColIdx('area', 'locality', 'zone', 'sector');
        const idxCity = findColIdx('city', 'town', 'district');
        const idxTerritory = findColIdx('territory', 'salesterritory', 'belt', 'route');
        const idxRep = findColIdx('assignedrep', 'rep', 'representative', 'fieldrep');
        const idxDlNo = findColIdx('druglicenseno', 'druglicense', 'dlno', 'dl', 'licenseno');
        const idxGstin = findColIdx('gstin', 'gst', 'taxid', 'gstno');
        const idxCreditDays = findColIdx('creditdays', 'creditperiod', 'days', 'paymentwindow');
        const idxCreditLimit = findColIdx('creditlimit', 'limit', 'creditamt');
        const idxDiscount = findColIdx('directdiscount', 'discount', 'discountpct', 'trademargin', 'margin');
        const idxPaymentTerms = findColIdx('paymentterms', 'preferredpaymentterms', 'terms');
        const idxStatus = findColIdx('accountstatus', 'status', 'tier');
        const idxNotes = findColIdx('notes', 'remarks', 'comments');

        if (idxName === -1) {
          resolve({
            stores: [],
            errors: ['Could not find "Medical Store Name" column. Please check that header row exists.'],
            totalRowsProcessed: rawJson.length - 1
          });
          return;
        }

        const parsedRows: ParsedMedicalStoreRow[] = [];
        const errors: string[] = [];

        rawJson.slice(1).forEach((row: any[], rowNum: number) => {
          if (!row || row.length === 0) return;

          const rawName = String(row[idxName] || '').trim();
          if (!rawName) return; // Skip blank rows

          const rawType = idxType !== -1 ? String(row[idxType] || '').trim() : '';
          const resolvedType = normalizeStoreType(rawType);

          const rawHospital = idxHospital !== -1 ? String(row[idxHospital] || '').trim() : '';
          const rawClinic = idxClinic !== -1 ? String(row[idxClinic] || '').trim() : '';

          // Doctor extraction (supports comma / semicolon separated)
          const rawDoctor = idxDoctor !== -1 ? String(row[idxDoctor] || '').trim() : '';
          const linkedDoctorNames = rawDoctor
            ? rawDoctor
                .split(/[,;\n]/)
                .map((d) => d.trim())
                .filter(Boolean)
            : [];

          const contactPerson = idxContact !== -1 ? String(row[idxContact] || '').trim() : 'Pharmacist in-Charge';
          const phone = idxPhone !== -1 ? String(row[idxPhone] || '').trim() : '+91 98000 00000';
          const address = idxAddress !== -1 ? String(row[idxAddress] || '').trim() : 'Commercial Market';
          const area = idxArea !== -1 ? String(row[idxArea] || '').trim() : 'Central Belt';
          const city = idxCity !== -1 ? String(row[idxCity] || '').trim() : 'Mumbai';
          const territory = idxTerritory !== -1 ? String(row[idxTerritory] || '').trim() : 'Central & South Medical Belt';
          const assignedRepName = idxRep !== -1 ? String(row[idxRep] || '').trim() : 'Direct Depot Delivery (No Rep)';

          const drugLicenseNo = idxDlNo !== -1 && row[idxDlNo] ? String(row[idxDlNo]).trim() : 'DL-20B-PENDING';
          const gstin = idxGstin !== -1 && row[idxGstin] ? String(row[idxGstin]).trim() : '';

          const creditDays = idxCreditDays !== -1 ? Number(row[idxCreditDays]) || (resolvedType === 'wholesale_chemist' ? 30 : 15) : 15;
          const creditLimit = idxCreditLimit !== -1 ? Number(row[idxCreditLimit]) || (resolvedType === 'wholesale_chemist' ? 500000 : 100000) : 100000;
          const directDiscountPct = idxDiscount !== -1 ? Number(row[idxDiscount]) || (resolvedType === 'wholesale_chemist' ? 10 : 5) : (resolvedType === 'wholesale_chemist' ? 10 : 5);
          const preferredPaymentTerms = idxPaymentTerms !== -1 ? String(row[idxPaymentTerms] || `Net ${creditDays} Days`).trim() : `Net ${creditDays} Days`;
          const status = idxStatus !== -1 ? normalizeStoreStatus(String(row[idxStatus] || '')) : (resolvedType === 'wholesale_chemist' ? 'high_volume' : 'active');
          const notes = idxNotes !== -1 ? String(row[idxNotes] || '').trim() : '';

          // Validation warnings
          if (resolvedType === 'hospital_pharmacy' && !rawHospital) {
            errors.push(`Row ${rowNum + 2} ("${rawName}"): Hospital Pharmacy is missing a Hospital Name.`);
          }
          if (resolvedType === 'clinic_counter' && !rawClinic) {
            errors.push(`Row ${rowNum + 2} ("${rawName}"): Clinic Attached Pharmacy is missing a Clinic Name.`);
          }

          parsedRows.push({
            name: rawName,
            type: resolvedType,
            contactPerson,
            phone,
            address,
            area,
            city,
            territory,
            assignedRepName,
            drugLicenseNo,
            gstin,
            hospitalName: resolvedType === 'hospital_pharmacy' ? rawHospital : undefined,
            clinicName: resolvedType === 'clinic_counter' ? rawClinic : undefined,
            linkedDoctorNames: linkedDoctorNames.length > 0 ? linkedDoctorNames : undefined,
            creditDays,
            creditLimit,
            directDiscountPct,
            preferredPaymentTerms,
            status,
            notes
          });
        });

        resolve({
          stores: parsedRows,
          errors,
          totalRowsProcessed: rawJson.length - 1
        });
      } catch (err: any) {
        resolve({
          stores: [],
          errors: [err?.message || 'Failed to parse Excel workbook.'],
          totalRowsProcessed: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        stores: [],
        errors: ['File reading failed.'],
        totalRowsProcessed: 0
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generates and downloads the Official Medical Stores Bulk Upload Excel Template
 * with pre-formatted sample rows illustrating all store categories (Wholesale Chemist,
 * Retail Chemist, Hospital Pharmacy with doctor linkage, Clinic Counter, Chain Depot)
 * plus a full Instructions sheet.
 */
export const downloadMedicalStoreExcelTemplate = () => {
  const headers = [
    'Medical Store Name *',
    'Store Type * (wholesale_chemist / retail_chemist / hospital_pharmacy / clinic_counter / chain_pharmacy)',
    'Hospital Name (Required if Hospital Pharmacy)',
    'Clinic Name (Required if Clinic Attached)',
    'Doctor Name(s) (Links directly to Doctor Directory, comma-separated)',
    'Contact Person / Pharmacist',
    'Mobile / Phone Number',
    'Full Store Address',
    'Area / Locality',
    'City',
    'Sales Territory',
    'Drug License Number (DL 20B/21B) *',
    'GSTIN (Tax ID)',
    'Credit Days (e.g. 15, 30)',
    'Credit Limit (INR)',
    'Direct Discount % (e.g. 5, 10, 12)',
    'Preferred Payment Terms',
    'Account Status (active / high_volume / pending_refill)',
    'Commercial Notes / Remarks'
  ];

  const sampleRows = [
    [
      'Navkar Wholesale Pharma Stockists & Distributors',
      'wholesale_chemist',
      '',
      '',
      '',
      'Mr. Arvind Oswal (B.Pharm)',
      '+91 98200 44123',
      'Warehouse 12, Dawa Bazaar Bulk Market, Princess Street',
      'Central Wholesale Hub',
      'Mumbai',
      'Central & South Medical Belt',
      '20B/21B-MH-MUM-884102',
      '27AABCN8899K1Z4',
      30,
      500000,
      12,
      'Net 30 Days',
      'high_volume',
      'Primary wholesale stockist. High monthly volume; orders directly from factory depot.'
    ],
    [
      'Apex Heart Hospital Pharmacy & Dispensing Counter',
      'hospital_pharmacy',
      'Metro Heart Hospital & Multispeciality Institute',
      '',
      'Dr. Rajesh Sharma, Dr. Anand Verma',
      'Mr. Ramesh Khandelwal (D.Pharm)',
      '+91 98210 33411',
      'Ground Floor, Metro Medical Tower, Ring Road',
      'Central District',
      'Mumbai',
      'Central & South Medical Belt',
      '20B/21B-MH-MUM-449102',
      '27AABCA1234F1Z8',
      21,
      250000,
      8,
      'Net 21 Days',
      'high_volume',
      'In-house hospital pharmacy servicing Cardiology & ICU patients. Linked to Dr. Rajesh Sharma.'
    ],
    [
      'Metro Lifeline Chamber Pharmacy',
      'clinic_counter',
      '',
      'Lifeline Polyclinic & Diabetology Chamber',
      'Dr. Vikramaditya Joshi',
      'Mr. Ajay Bhatt',
      '+91 98334 77890',
      'Opp. Metro Gate 3, Central Medical Complex',
      'Central District',
      'Mumbai',
      'Central & South Medical Belt',
      '20B/21B-MH-MUM-551029',
      '27AABCM9012K1Z5',
      15,
      100000,
      5,
      'Net 15 Days',
      'active',
      'Attached to Dr. Vikramaditya Joshi pulmonary clinic. Direct trade billing.'
    ],
    [
      'Green Park Chemists & Druggists',
      'retail_chemist',
      '',
      '',
      '',
      'Mr. Suresh Gupta',
      '+91 98119 55432',
      'Shop 4, Commercial Belt 2, Green Park',
      'South District',
      'New Delhi',
      'Central & South Medical Belt',
      '20B/21B-DL-SZ-220194',
      '07AAACD5678G1Z2',
      30,
      150000,
      5,
      'Net 30 Days',
      'active',
      'Neighborhood high-footfall chemist. Good paymaster.'
    ],
    [
      'Apollo Central Pharma Mother Depot',
      'chain_pharmacy',
      '',
      '',
      '',
      'Procurement Manager - Supply Chain',
      '+91 99000 88776',
      'Plot 45, Logistics Industrial Estate, Outer Ring Road',
      'West Logistics Belt',
      'Ahmedabad',
      'West Suburbs & SuperSpecialty Hub',
      '20B/21B-GJ-AHM-990011',
      '24AABCA9900M1Z2',
      45,
      1500000,
      15,
      'Net 45 Days',
      'high_volume',
      'Central mother depot replenishing 60+ retail chain stores. Requires strict FIFO batch dispatch.'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set intelligent column widths
  ws['!cols'] = [
    { wch: 36 }, // Name
    { wch: 22 }, // Type
    { wch: 32 }, // Hospital Name
    { wch: 30 }, // Clinic Name
    { wch: 32 }, // Doctor Name(s)
    { wch: 26 }, // Contact
    { wch: 18 }, // Phone
    { wch: 38 }, // Address
    { wch: 20 }, // Area
    { wch: 16 }, // City
    { wch: 26 }, // Territory
    { wch: 24 }, // DL No
    { wch: 20 }, // GSTIN
    { wch: 14 }, // Credit Days
    { wch: 18 }, // Credit Limit
    { wch: 16 }, // Direct Discount %
    { wch: 22 }, // Payment Terms
    { wch: 18 }, // Status
    { wch: 35 }  // Notes
  ];

  // Instructions Sheet
  const instructionHeaders = ['Field Name', 'Required?', 'Permitted Values / Format', 'Description & Business Rule'];
  const instructions = [
    [
      'Medical Store Name',
      'YES',
      'Text (e.g. Sanjivani Medicos)',
      'Official trade name of the medical store, chemist counter, or wholesale distribution entity.'
    ],
    [
      'Store Type',
      'YES',
      'wholesale_chemist, retail_chemist, hospital_pharmacy, clinic_counter, chain_pharmacy',
      'Wholesale Chemist (B2B bulk), Retail Chemist (retail counter), Hospital Pharmacy (inpatient/OPD), Clinic Counter (attached chamber), Chain Pharmacy (mother depot).'
    ],
    [
      'Hospital Name',
      'Conditional',
      'Text (e.g. Metro Heart Hospital)',
      'Mandatory when Store Type is "hospital_pharmacy". Populates institutional entity.'
    ],
    [
      'Clinic Name',
      'Conditional',
      'Text (e.g. Apex Diabetes Clinic)',
      'Mandatory when Store Type is "clinic_counter". Populates attached chamber clinic name.'
    ],
    [
      'Doctor Name(s)',
      'Recommended',
      'Text, comma-separated (e.g. Dr. Rajesh Sharma, Dr. Anand Verma)',
      'Directly links this medical store to physicians in the Doctor Directory. Displays an attached pharmacy card against the doctor.'
    ],
    [
      'Contact Person / Pharmacist',
      'Optional',
      'Text (e.g. Rajesh Kumar D.Pharm)',
      'Registered pharmacist in-charge or commercial account manager.'
    ],
    [
      'Mobile / Phone Number',
      'Optional',
      '+91 XXXXX XXXXX',
      'Contact telephone for order booking, direct invoice dispatch, and dispatch confirmations.'
    ],
    [
      'Drug License Number',
      'Recommended',
      'e.g. 20B/21B-MH-MUM-449102',
      'Mandatory Form 20B/21B retail/wholesale chemist drug license number under Drugs and Cosmetics Act.'
    ],
    [
      'GSTIN',
      'Recommended',
      '15-character alphanumeric tax ID',
      'State GST registration credential for automated B2B e-invoicing.'
    ],
    [
      'Credit Days',
      'Optional',
      'Integer (e.g. 15, 21, 30)',
      'Agreed commercial payment window in days. Defaults to 15 (retail) or 30 (wholesale).'
    ],
    [
      'Direct Discount %',
      'Optional',
      'Number (e.g. 5, 10, 12)',
      'Direct trade margin / discount offered for orders without doctor detailing involvement.'
    ],
    [
      'Account Status',
      'Optional',
      'active, high_volume, pending_refill',
      'Classification for priority stock replenishment and replenishment alerts.'
    ]
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet([instructionHeaders, ...instructions]);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 55 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Medical Stores Template');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Column Guide');

  XLSX.writeFile(wb, `ddb_medical_stores_bulk_upload_template_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
