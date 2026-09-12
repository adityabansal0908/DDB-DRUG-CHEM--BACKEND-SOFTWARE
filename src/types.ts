export type UserRole = 'admin' | 'sales_rep';

export interface Product {
  id: string;
  name: string;
  genericName: string;
  category: 'Antibiotics' | 'Cardiology' | 'Gastroenterology' | 'Respiratory' | 'Analgesics' | 'Diabetology';
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment';
  strength: string;
  mrp: number;
  purchasePrice: number;
  sellingRate: number; // Tier 1 Rep rate
  stockUnits: number;
  batchNo: string;
  expiryDate: string;
  minOrderQty: number;
  status: 'active' | 'low_stock' | 'out_of_stock';
  indication: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  area: string;
  phone: string;
  bestTimeToVisit: string;
  targetVisitsPerMonth: number;
  visitsCompletedThisMonth: number;
  avatarUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  scheduledTime?: string;
  status?: 'completed' | 'pending' | 'in_progress';
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
  currentLocationName: string;
  batteryLevel: number;
  gpsSignal: 'High' | 'Medium' | 'Low';
  lastCheckinTime: string;
}

export interface OrderOrSampleRequest {
  id: string;
  repId: string;
  repName: string;
  doctorName: string;
  clinicName: string;
  date: string;
  items: {
    productName: string;
    qty: number;
    price: number;
  }[];
  totalAmount: number;
  type: 'Order' | 'Sample';
  status: 'pending' | 'approved' | 'rejected';
}
