import * as XLSX from 'xlsx';
import { Product, DoctorVisitingSlot } from '../types';

export interface ParsedDoctorRow {
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  city: string;
  area: string;
  phone: string;
  bestTimeToVisit: string;
  visitingDays: string[];
  visitingSlots: DoctorVisitingSlot[];
  targetVisitsPerMonth: number;
  dateOfBirth: string;
  targetedProducts: string[];
  adminRemarks: string;
}

export interface DoctorExcelImportResult {
  doctors: ParsedDoctorRow[];
  errors: string[];
  totalRowsProcessed: number;
}

const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const ALL_WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const STANDARD_WORK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parses raw visiting days string (e.g. "Mon, Tue, Wed, Fri" or "Mon - Sat" or "Mon-Fri")
 */
export const parseVisitingDaysString = (raw: string): string[] => {
  if (!raw || !raw.trim()) return [...STANDARD_WORK_DAYS];
  const s = raw.trim().toLowerCase();

  if (s.includes('all') || s.includes('everyday') || s.includes('daily') || s.includes('7 days')) {
    return [...ALL_WEEK_DAYS];
  }
  if (s.includes('mon-fri') || s.includes('mon - fri') || s.includes('weekdays')) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }
  if (s.includes('mon-sat') || s.includes('mon - sat')) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  const dayMap: { [k: string]: string } = {
    mon: 'Mon',
    monday: 'Mon',
    m: 'Mon',
    tue: 'Tue',
    tues: 'Tue',
    tuesday: 'Tue',
    tu: 'Tue',
    wed: 'Wed',
    wednesday: 'Wed',
    w: 'Wed',
    thu: 'Thu',
    thur: 'Thu',
    thurs: 'Thu',
    thursday: 'Thu',
    th: 'Thu',
    fri: 'Fri',
    friday: 'Fri',
    f: 'Fri',
    sat: 'Sat',
    saturday: 'Sat',
    sa: 'Sat',
    sun: 'Sun',
    sunday: 'Sun',
    su: 'Sun'
  };

  const tokens = raw.split(/[,;\/|&+\n\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const matched: string[] = [];

  tokens.forEach((t) => {
    const day = dayMap[t];
    if (day && !matched.includes(day)) {
      matched.push(day);
    }
  });

  return matched.length > 0 ? matched : [...STANDARD_WORK_DAYS];
};

/**
 * Parses raw visiting time slots string (e.g. "10:00 AM - 01:00 PM; 05:30 PM - 08:30 PM" or "Morning: 10-1 | Evening: 6-9")
 */
export const parseVisitingSlotsString = (raw: string, defaultDays?: string[]): DoctorVisitingSlot[] => {
  const days = defaultDays && defaultDays.length > 0 ? defaultDays : [...STANDARD_WORK_DAYS];

  if (!raw || !raw.trim()) {
    return [
      {
        id: 'slot-1',
        slotName: 'Morning Chamber',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        days
      }
    ];
  }

  // Split by semicolons, pipes, newlines or double-slash
  const segments = raw.split(/[;\n|\/]{1,2}/).map((s) => s.trim()).filter(Boolean);
  const slots: DoctorVisitingSlot[] = [];

  segments.forEach((seg, idx) => {
    let label = `Slot ${idx + 1}`;
    let timePart = seg;

    // Check for custom label like "Morning: 10:00 AM - 01:00 PM"
    if (seg.includes(':') && !seg.match(/^\d{1,2}:\d{2}/)) {
      const colonIndex = seg.indexOf(':');
      const candidateLabel = seg.substring(0, colonIndex).trim();
      const candidateTime = seg.substring(colonIndex + 1).trim();
      if (candidateTime) {
        label = candidateLabel;
        timePart = candidateTime;
      }
    } else {
      if (idx === 0) label = 'Morning Slot';
      else if (idx === 1) label = 'Evening Slot';
      else if (idx === 2) label = 'Afternoon Slot';
    }

    // Split range by '-' or 'to'
    const match = timePart.match(/(.+?)(?:-|to|–)(.+)/i);
    let startTime = '10:00 AM';
    let endTime = '01:00 PM';

    if (match) {
      startTime = match[1].trim();
      endTime = match[2].trim();
    } else {
      startTime = timePart.trim();
      endTime = '';
    }

    slots.push({
      id: `slot-${idx + 1}`,
      slotName: label,
      startTime,
      endTime,
      days
    });
  });

  return slots.length > 0
    ? slots
    : [
        {
          id: 'slot-1',
          slotName: 'General Chamber',
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          days
        }
      ];
};

/**
 * Formats a clean composite summary string from days and slots
 */
export const formatVisitingSummary = (days: string[] = [], slots: DoctorVisitingSlot[] = []): string => {
  const daysStr = days.length === 7 ? 'All Week (Mon-Sun)' : days.length === 6 && !days.includes('Sun') ? 'Mon - Sat' : days.length === 5 && !days.includes('Sat') && !days.includes('Sun') ? 'Mon - Fri' : days.join(', ');

  if (!slots || slots.length === 0) {
    return daysStr ? `${daysStr}: 10:00 AM - 01:00 PM` : '10:00 AM - 01:00 PM';
  }

  const slotsStr = slots
    .map((s) => (s.endTime ? `${s.slotName ? `${s.slotName} (` : ''}${s.startTime} - ${s.endTime}${s.slotName ? ')' : ''}` : s.startTime))
    .join('; ');

  return daysStr ? `${daysStr} • ${slotsStr}` : slotsStr;
};

/**
 * Parses an Excel or CSV file containing doctor directory entries
 */
export const parseDoctorExcelFile = async (file: File): Promise<DoctorExcelImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            doctors: [],
            errors: ['The uploaded spreadsheet is empty.'],
            totalRowsProcessed: 0
          });
          return;
        }

        const errors: string[] = [];
        const parsedRows: ParsedDoctorRow[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;

          let name = '';
          let specialty = '';
          let clinicName = '';
          let address = '';
          let city = '';
          let area = '';
          let phone = '';
          let visitingDaysRaw = '';
          let visitingSlotsRaw = '';
          let bestTimeToVisitRaw = '';
          let targetVisitsPerMonth = 4;
          let dateOfBirth = '';
          let targetedProductsRaw = '';
          let adminRemarks = '';

          Object.keys(row).forEach((k) => {
            const normalized = normalizeHeader(k);
            const val = row[k];

            if (normalized.includes('doctor') || (normalized.includes('name') && !normalized.includes('clinic'))) {
              name = String(val).trim();
            } else if (normalized.includes('specialty') || normalized.includes('speciality') || normalized.includes('degree')) {
              specialty = String(val).trim();
            } else if (normalized.includes('clinic') || normalized.includes('hospital') || normalized.includes('chamber') && !normalized.includes('day') && !normalized.includes('hour')) {
              clinicName = String(val).trim();
            } else if (normalized.includes('address') || normalized.includes('street')) {
              address = String(val).trim();
            } else if (normalized.includes('city') || normalized.includes('town') || normalized.includes('district')) {
              city = String(val).trim();
            } else if (normalized.includes('area') || normalized.includes('territory') || normalized.includes('zone') || normalized.includes('beat')) {
              area = String(val).trim();
            } else if (normalized.includes('phone') || normalized.includes('contact') || normalized.includes('mobile') || normalized.includes('tel')) {
              phone = String(val).trim();
            } else if (normalized.includes('day') || normalized.includes('visitingday') || normalized.includes('chamberday') || normalized.includes('opdday')) {
              visitingDaysRaw = String(val).trim();
            } else if (normalized.includes('slot') || normalized.includes('timeslot') || normalized.includes('visitingslot')) {
              visitingSlotsRaw = String(val).trim();
            } else if (normalized.includes('visit') || normalized.includes('hour') || normalized.includes('timing')) {
              bestTimeToVisitRaw = String(val).trim();
            } else if (normalized.includes('target') || normalized.includes('quota') || normalized.includes('monthly')) {
              const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
              targetVisitsPerMonth = isNaN(num) || num <= 0 ? 4 : num;
            } else if (normalized.includes('birth') || normalized.includes('dob') || normalized.includes('bday')) {
              if (val instanceof Date) {
                const yyyy = val.getFullYear();
                const mm = String(val.getMonth() + 1).padStart(2, '0');
                const dd = String(val.getDate()).padStart(2, '0');
                dateOfBirth = `${yyyy}-${mm}-${dd}`;
              } else {
                dateOfBirth = String(val).trim();
              }
            } else if (normalized.includes('product') || normalized.includes('market') || normalized.includes('brand') || normalized.includes('formulation')) {
              targetedProductsRaw = String(val).trim();
            } else if (normalized.includes('remark') || normalized.includes('note') || normalized.includes('comment') || normalized.includes('admin')) {
              adminRemarks = String(val).trim();
            }
          });

          // Validation
          if (!name) {
            errors.push(`Row ${rowNum}: Skipped because Doctor Name is missing.`);
            return;
          }

          if (!name.startsWith('Dr.') && !name.startsWith('Dr ')) {
            name = `Dr. ${name}`;
          }

          // Defaults
          if (!specialty) specialty = 'Consultant Physician (MBBS, MD)';
          if (!clinicName) clinicName = 'Physician Chamber';
          if (!area) area = 'Central District';
          if (!city) city = 'Mumbai';
          if (!address) address = `${clinicName}, ${area}, ${city}`;
          if (!phone) phone = '+91 98200 00000';

          // Visiting days & multiple slots parsing
          const visitingDays = parseVisitingDaysString(visitingDaysRaw);
          const slotsSource = visitingSlotsRaw || bestTimeToVisitRaw || '10:30 AM - 01:00 PM';
          const visitingSlots = parseVisitingSlotsString(slotsSource, visitingDays);
          const bestTimeToVisit = formatVisitingSummary(visitingDays, visitingSlots);

          // Split targeted products by comma/semicolon/newline
          const targetedProducts = targetedProductsRaw
            ? targetedProductsRaw
                .split(/[,;\n|]+/)
                .map((p) => p.trim())
                .filter(Boolean)
            : [];

          parsedRows.push({
            name,
            specialty,
            clinicName,
            address,
            city,
            area,
            phone,
            bestTimeToVisit,
            visitingDays,
            visitingSlots,
            targetVisitsPerMonth,
            dateOfBirth,
            targetedProducts,
            adminRemarks
          });
        });

        resolve({
          doctors: parsedRows,
          errors,
          totalRowsProcessed: rawJson.length
        });
      } catch (err: any) {
        resolve({
          doctors: [],
          errors: [err?.message || 'Failed to parse Excel file. Please ensure valid structure.'],
          totalRowsProcessed: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        doctors: [],
        errors: ['File reading failed.'],
        totalRowsProcessed: 0
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generates and downloads the Official Doctors Directory Excel Template
 * with dedicated Visiting Days and Multiple Visiting Time Slots support.
 */
export const downloadDoctorExcelTemplate = (catalogProducts: Product[] = []) => {
  const headers = [
    'Doctor Name',
    'Specialty / Degree',
    'Clinic / Hospital Chamber',
    'Chamber Address',
    'City',
    'Territory / Area',
    'Contact Number',
    'Visiting Days (e.g. Mon, Tue, Wed, Thu, Fri, Sat)',
    'Visiting Time Slots (Multiple separated by ;)',
    'Monthly Target Visits',
    'Doctor Birth Date (YYYY-MM-DD)',
    'Targeted Products (Comma-separated)',
    'Admin Remarks'
  ];

  // Pick sample product names if available in catalog
  const sampleP1 = catalogProducts[0]?.name || 'TelmiKard 40-H';
  const sampleP2 = catalogProducts[1]?.name || 'AmoxyClav 625 Duo';
  const sampleP3 = catalogProducts[2]?.name || 'Pantocid DSR';
  const sampleP4 = catalogProducts[3]?.name || 'Montair-LC';

  const sampleRows = [
    [
      'Dr. Anand Verma',
      'Cardiologist (MD, DM)',
      'City Heart Care Clinic',
      '204, Doctor Chambers, Opp. Civil Hospital',
      'Mumbai',
      'South Zone / Bandra',
      '+91 98200 12345',
      'Mon, Tue, Wed, Thu, Fri, Sat',
      'Morning: 10:00 AM - 01:00 PM; Evening: 06:00 PM - 08:30 PM',
      4,
      '1979-05-14',
      `${sampleP1}, ${sampleP2}`,
      'Senior cardiologist; key opinion leader for hypertension division.'
    ],
    [
      'Dr. Meenakshi Sunder',
      'Consultant Gastroenterologist',
      'Metro Digestive Health Institute',
      'Suite 12, Apollo Arcade, Ring Road',
      'New Delhi',
      'Central Zone',
      '+91 98110 54321',
      'Mon, Wed, Fri',
      'Afternoon: 01:30 PM - 03:30 PM; Evening: 07:00 PM - 09:00 PM',
      3,
      '1983-09-22',
      `${sampleP3}`,
      'Prefers afternoon detailing. Interested in bulk clinical sampling.'
    ],
    [
      'Dr. Harish Joshi',
      'Senior Pulmonologist',
      'Lifeline Chest Care Hospital',
      'Plot 45, Near Railway Station',
      'Pune',
      'East Zone',
      '+91 99201 88402',
      'Mon, Tue, Thu, Sat',
      'Chamber 1: 09:30 AM - 12:30 PM; Chamber 2: 04:00 PM - 06:30 PM',
      4,
      '1975-12-08',
      `${sampleP4}, ${sampleP2}`,
      'Focus on pediatric and respiratory anti-infective formulations.'
    ],
    [
      'Dr. Sunita Patel',
      'Chief Diabetologist & Endocrinologist',
      'CarePlus Endocrine & Diabetes Centre',
      'Shop 8-10, Shivalik High Street',
      'Ahmedabad',
      'West Zone',
      '+91 98450 67123',
      'Mon, Tue, Wed, Thu, Fri, Sat',
      'Morning OPD: 11:00 AM - 02:00 PM; Evening OPD: 06:30 PM - 09:00 PM',
      3,
      '1981-08-30',
      `${sampleP1}`,
      'High prescription writer for metabolic disorder portfolio.'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 22 }, // Doctor Name
    { wch: 30 }, // Specialty
    { wch: 32 }, // Clinic Name
    { wch: 38 }, // Address
    { wch: 16 }, // City
    { wch: 22 }, // Territory
    { wch: 18 }, // Contact
    { wch: 35 }, // Visiting Days
    { wch: 50 }, // Visiting Time Slots (Multiple)
    { wch: 16 }, // Target Visits
    { wch: 20 }, // Birth Date
    { wch: 32 }, // Targeted Products
    { wch: 45 }  // Admin Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Doctors Directory');

  XLSX.writeFile(wb, 'DDB_DRUG_CHEM_Doctors_Directory_Template.xlsx');
};

