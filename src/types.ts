export type UserRole = 'admin' | 'sales_rep';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  repId?: string; // Links to sales rep profile if role is 'sales_rep'
  avatarUrl?: string;
  avatarType?: 'image' | 'monogram';
  isOnline: boolean;
  lastActiveTime?: number;
  lastLoginTime?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string; // e.g. "Today, 02:45 PM"
  userEmail: string;
  userName: string;
  userRole: UserRole;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'UNDO' | 'CLEAR' | 'LOGIN' | 'LOGOUT';
  module: 'Product Catalog' | 'Doctors' | 'Authentication' | 'Field Visits' | 'Orders';
  targetItemName: string;
  details: string; // Plain summary of what was changed
  previousStateSnippet?: string; // Optional diff context
  newStateSnippet?: string;
}

export interface ProductBatch {
  id?: string;
  batchNumber: string;
  expiryDate: string;
  stock?: number;
}

export interface Product {
  id: string;
  name: string; // Column 1: Product Name
  genericName: string; // Column 2: Salt Name/ Composition
  packaging: string; // Column 3: Packaging (e.g. 10x10 Tablets, 100ml)
  form: string; // Column 4: Dosage form (Tablet, Capsule, Syrup, etc.)
  mrp: number; // Column 5: MRP
  pricingToStockist?: number; // Column 6: Pricing to Stockist (PTS)
  pricingToRetailer?: number; // Column 7: Pricing to Retailer (PTR)
  sellingRate: number; // Column 8: Selling Price
  purchasePrice: number; // Column 9: Purchase Price
  gst: number | string; // Column 10: GST
  company?: string; // Column 11: Company (Manufacturing Company Name)
  category?: string; // Column 12: Category / Speciality (Open field, e.g. Antibiotics, Cardiology, Orthopedics)
  hiddenFromRep?: boolean; // Flag to hide formulation from Sales Rep view
  stockUnits?: number; // Optional stock
  batchNo?: string; // Optional batch
  expiryDate?: string; // Optional expiry
  batches?: ProductBatch[];
  strength?: string;
  minOrderQty?: number;
  status?: 'active' | 'low_stock' | 'out_of_stock';
  indication?: string;
}

export type ProductCatalogColumnKey =
  | 'name'
  | 'genericName'
  | 'packaging'
  | 'form'
  | 'mrp'
  | 'pricingToStockist'
  | 'pricingToRetailer'
  | 'sellingRate'
  | 'purchasePrice'
  | 'gst'
  | 'company'
  | 'category';

export interface CatalogColumnMeta {
  key: ProductCatalogColumnKey;
  label: string;
  shortLabel: string;
  orderNumber: number;
  description: string;
  group: 'basic' | 'commercial' | 'tax_org';
}

export const CATALOG_COLUMNS: CatalogColumnMeta[] = [
  {
    key: 'name',
    label: 'Product Name',
    shortLabel: 'Name',
    orderNumber: 1,
    description: 'Commercial brand name of the formulation',
    group: 'basic'
  },
  {
    key: 'genericName',
    label: 'Salt / Composition',
    shortLabel: 'Salt',
    orderNumber: 2,
    description: 'Active pharmaceutical active ingredient (API)',
    group: 'basic'
  },
  {
    key: 'packaging',
    label: 'Packaging',
    shortLabel: 'Pack',
    orderNumber: 3,
    description: 'Strip / bottle presentation (e.g. 10x10 Tablets)',
    group: 'basic'
  },
  {
    key: 'form',
    label: 'Dosage Form',
    shortLabel: 'Form',
    orderNumber: 4,
    description: 'Tablet, Capsule, Syrup, Injection, etc.',
    group: 'basic'
  },
  {
    key: 'mrp',
    label: 'MRP (Maximum Retail Price)',
    shortLabel: 'MRP',
    orderNumber: 5,
    description: 'Maximum printed retail price to consumer',
    group: 'commercial'
  },
  {
    key: 'pricingToStockist',
    label: 'Pricing to Stockist (PTS)',
    shortLabel: 'PTS',
    orderNumber: 6,
    description: 'Rate offered directly to wholesale stockists / distributors',
    group: 'commercial'
  },
  {
    key: 'pricingToRetailer',
    label: 'Pricing to Retailer (PTR)',
    shortLabel: 'PTR',
    orderNumber: 7,
    description: 'Billed trade price offered to chemist / retail pharmacies',
    group: 'commercial'
  },
  {
    key: 'sellingRate',
    label: 'Selling Price (Rep Rate)',
    shortLabel: 'Selling',
    orderNumber: 8,
    description: 'Special field rate representative offers to clinic accounts',
    group: 'commercial'
  },
  {
    key: 'purchasePrice',
    label: 'Purchase Price (Cost)',
    shortLabel: 'Purchase',
    orderNumber: 9,
    description: 'Internal procurement manufacturing / buying price',
    group: 'commercial'
  },
  {
    key: 'gst',
    label: 'GST Slab',
    shortLabel: 'GST',
    orderNumber: 10,
    description: 'Applicable pharmaceutical Goods and Services Tax slab',
    group: 'tax_org'
  },
  {
    key: 'company',
    label: 'Manufacturing Company',
    shortLabel: 'Company',
    orderNumber: 11,
    description: 'Manufacturer / Brand marketing owner',
    group: 'tax_org'
  },
  {
    key: 'category',
    label: 'Category / Speciality',
    shortLabel: 'Category',
    orderNumber: 12,
    description: 'Therapeutic clinical speciality (e.g. Cardiology, Antibiotics)',
    group: 'tax_org'
  }
];

export interface DoctorVisitingSlot {
  id?: string;
  slotName?: string; // e.g. "Morning Chamber", "Evening OPD", "Chamber 1", "Slot 1"
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "01:00 PM"
  days?: string[]; // Specific days for this slot (e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  city?: string; // 1. City where clinic/chamber is located
  area: string;
  phone: string;
  bestTimeToVisit: string; // Composite summary string, e.g. "Mon-Sat: 10:00 AM - 01:00 PM, 06:00 PM - 08:30 PM"
  visitingDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  visitingSlots?: DoctorVisitingSlot[]; // Multiple visiting time slots
  targetVisitsPerMonth: number;
  visitsCompletedThisMonth: number;
  avatarUrl: string;
  dateOfBirth?: string; // 2. Doctor's birth date (YYYY-MM-DD or formatted)
  targetedProducts?: string[]; // 3. Multiple products marketed to this doctor (fetched from product catalog)
  adminRemarks?: string; // 4. Remarks to be filled by admin only
  coordinates: {
    lat: number;
    lng: number;
  };
  scheduledTime?: string;
  status?: 'completed' | 'pending' | 'in_progress';
  assignedRepIds?: string[];
}

export type AdminTabKey =
  | 'dashboard'
  | 'monitoring'
  | 'doctors'
  | 'products'
  | 'reps'
  | 'orders'
  | 'reports'
  | 'history';

export type RepTabKey = 'route' | 'checkin' | 'catalog' | 'activity';

export interface NavigationScreen {
  role: UserRole;
  adminTab: AdminTabKey;
  repTab: RepTabKey;
  screenTitle?: string;
  timestamp?: number;
}

export interface FieldVisit {
  id: string;
  repId: string;
  repName: string;
  repAvatar: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  timestamp: string; // ISO or formatted
  isoDate?: string;
  purpose: 'Product Detailing' | 'Sample Distribution' | 'Order Booking' | 'Payment Follow-up' | 'Routine Relationship';
  photoUrl: string;
  notes: string;
  locationVerified: boolean;
  distanceMeters: number;
  productsDiscussed: string[];
  sampleUnitsGiven: number;
  orderValueBooked?: number;
  approvalStatus: 'approved' | 'pending' | 'flagged';
  feedbackFromDoctor?: string;
}

export interface SalesRep {
  id: string;
  name: string;
  employeeCode: string;
  territory: string;
  phone: string;
  avatarUrl: string;
  status: 'active_in_field' | 'idle' | 'completed_day';
  todayVisitsCompleted: number;
  todayTarget: number;
  monthlyTarget: number;
  monthlyAchieved: number;
  monthlyRevenueTarget?: number;
  monthlyRevenueAchieved?: number;
  targetNotes?: string;
  targetPeriod?: string;
  assignedDoctorIds?: string[];
  currentLocationName: string;
  batteryLevel: number;
  gpsSignal: 'High' | 'Medium' | 'Low';
  lastCheckinTime: string;
}

export interface RetailCounter {
  id: string;
  name: string;
  type: 'retail_chemist' | 'hospital_pharmacy' | 'clinic_counter' | 'chain_pharmacy';
  contactPerson: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  territory: string;
  assignedRepId: string;
  assignedRepName: string;
  drugLicenseNo: string;
  gstin: string;
  productsSold: {
    productId?: string;
    productName: string;
    genericName?: string;
    monthlyUnitsSold: number;
    billingRate: number;
    lastOrderDate: string;
    lastOrderAmount: number;
  }[];
  totalMonthlyRevenue: number;
  creditDays: number;
  status: 'active' | 'pending_refill' | 'high_volume';
}

export interface OrderOrSampleRequest {
  id: string;
  repId: string;
  repName: string;
  doctorName: string;
  clinicName: string;
  date: string;
  isoDate?: string;
  items: {
    productName: string;
    qty: number;
    price: number;
  }[];
  totalAmount: number;
  type: 'Order' | 'Sample';
  status: 'pending' | 'approved' | 'rejected';
}

export type NotificationType =
  | 'visit_logged'
  | 'order_submitted'
  | 'rep_login'
  | 'rep_logout'
  | 'rep_status_change'
  | 'rep_account_activity'
  | 'location_update'
  | 'target_update'
  | 'sample_requested';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  repId: string;
  repName: string;
  repAvatar?: string;
  timestamp: string; // ISO string
  formattedTime: string; // e.g. "Just now", "2m ago", "10:30 AM"
  read: boolean;
  priority?: 'high' | 'normal' | 'urgent';
  targetTab?: AdminTabKey;
  metadata?: {
    visitId?: string;
    orderId?: string;
    doctorId?: string;
    doctorName?: string;
    amount?: number;
    territory?: string;
    purpose?: string;
    clinicName?: string;
    status?: string;
    details?: string;
  };
}
