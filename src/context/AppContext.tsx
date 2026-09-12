import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Doctor, FieldVisit, SalesRep, OrderOrSampleRequest, UserRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_DOCTORS, INITIAL_REPS, INITIAL_VISITS, INITIAL_ORDERS } from '../data/mockData';
import { toast } from 'sonner';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  deviceView: 'desktop' | 'mobile_frame';
  setDeviceView: (view: 'desktop' | 'mobile_frame') => void;
  activeAdminTab: 'monitoring' | 'products' | 'reps' | 'orders';
  setActiveAdminTab: (tab: 'monitoring' | 'products' | 'reps' | 'orders') => void;
  activeRepTab: 'route' | 'checkin' | 'catalog' | 'activity';
  setActiveRepTab: (tab: 'route' | 'checkin' | 'catalog' | 'activity') => void;
  currentRep: SalesRep;
  setCurrentRep: (rep: SalesRep) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  doctors: Doctor[];
  updateDoctorStatus: (doctorId: string, status: 'completed' | 'in_progress' | 'pending') => void;
  visits: FieldVisit[];
  addCheckinVisit: (visitData: Omit<FieldVisit, 'id' | 'repId' | 'repName' | 'repAvatar' | 'approvalStatus' | 'timestamp'>) => void;
  approveVisit: (visitId: string) => void;
  flagVisit: (visitId: string) => void;
  reps: SalesRep[];
  orders: OrderOrSampleRequest[];
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  previewPhotoUrl: string | null;
  setPreviewPhotoUrl: (url: string | null) => void;
  selectedDoctorForCheckin: Doctor | null;
  setSelectedDoctorForCheckin: (doctor: Doctor | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile_frame'>('desktop');
  const [activeAdminTab, setActiveAdminTab] = useState<'monitoring' | 'products' | 'reps' | 'orders'>('monitoring');
  const [activeRepTab, setActiveRepTab] = useState<'route' | 'checkin' | 'catalog' | 'activity'>('route');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pharmatrack_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('pharmatrack_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [reps] = useState<SalesRep[]>(INITIAL_REPS);
  const [currentRep, setCurrentRep] = useState<SalesRep>(INITIAL_REPS[0]);

  const [visits, setVisits] = useState<FieldVisit[]>(() => {
    const saved = localStorage.getItem('pharmatrack_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [orders, setOrders] = useState<OrderOrSampleRequest[]>(() => {
    const saved = localStorage.getItem('pharmatrack_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedDoctorForCheckin, setSelectedDoctorForCheckin] = useState<Doctor | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('pharmatrack_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_orders', JSON.stringify(orders));
  }, [orders]);

  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [product, ...prev]);
    toast.success(`Product "${product.name}" added to catalog`, {
      description: `MRP ₹${product.mrp} | Rep Rate ₹${product.sellingRate}`
    });
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    toast.success(`Updated "${updated.name}" pricing & inventory`);
  };

  const updateDoctorStatus = (doctorId: string, status: 'completed' | 'in_progress' | 'pending') => {
    setDoctors(prev => prev.map(doc => doc.id === doctorId ? { ...doc, status } : doc));
  };

  const addCheckinVisit = (visitData: Omit<FieldVisit, 'id' | 'repId' | 'repName' | 'repAvatar' | 'approvalStatus' | 'timestamp'>) => {
    const newVisit: FieldVisit = {
      ...visitData,
      id: `visit-${Date.now()}`,
      repId: currentRep.id,
      repName: currentRep.name,
      repAvatar: currentRep.avatarUrl,
      timestamp: 'Just now',
      approvalStatus: 'pending'
    };

    setVisits(prev => [newVisit, ...prev]);
    
    // Update doctor's status
    updateDoctorStatus(visitData.doctorId, 'completed');

    // If order was booked, create an order request
    if (visitData.orderValueBooked && visitData.orderValueBooked > 0) {
      const newOrder: OrderOrSampleRequest = {
        id: `ord-${Date.now()}`,
        repId: currentRep.id,
        repName: currentRep.name,
        doctorName: visitData.doctorName,
        clinicName: visitData.clinicName,
        date: 'Today, Just now',
        type: 'Order',
        status: 'pending',
        totalAmount: visitData.orderValueBooked,
        items: visitData.productsDiscussed.map(name => ({
          productName: name,
          qty: 25,
          price: 150
        }))
      };
      setOrders(prev => [newOrder, ...prev]);
    }

    toast.success('Check-in submitted successfully!', {
      description: `GPS verified at ${visitData.clinicName} (±${visitData.distanceMeters}m)`
    });
  };

  const approveVisit = (visitId: string) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, approvalStatus: 'approved' } : v));
    toast.success('Field visit approved', {
      description: 'Logged to rep monthly target compliance'
    });
  };

  const flagVisit = (visitId: string) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, approvalStatus: 'flagged' } : v));
    toast.error('Visit flagged for inspection', {
      description: 'Sent alert to territory manager'
    });
  };

  const approveOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'approved' } : o));
    toast.success('Order approved for billing & warehouse dispatch');
  };

  const rejectOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
    toast.error('Order rejected');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        deviceView,
        setDeviceView,
        activeAdminTab,
        setActiveAdminTab,
        activeRepTab,
        setActiveRepTab,
        currentRep,
        setCurrentRep,
        products,
        addProduct,
        updateProduct,
        doctors,
        updateDoctorStatus,
        visits,
        addCheckinVisit,
        approveVisit,
        flagVisit,
        reps,
        orders,
        approveOrder,
        rejectOrder,
        previewPhotoUrl,
        setPreviewPhotoUrl,
        selectedDoctorForCheckin,
        setSelectedDoctorForCheckin
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
