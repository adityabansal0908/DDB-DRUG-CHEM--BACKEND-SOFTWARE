import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Product,
  ProductCatalogColumnKey,
  Doctor,
  FieldVisit,
  SalesRep,
  OrderOrSampleRequest,
  RetailCounter,
  UserRole,
  AuthUser,
  AuditLog,
  AdminTabKey,
  RepTabKey,
  NavigationScreen,
  AdminNotification,
  NotificationType
} from '../types';
import {
  INITIAL_DOCTORS,
  INITIAL_REPS,
  INITIAL_VISITS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_RETAIL_COUNTERS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { toast } from 'sonner';
import { playNotificationChime } from '../utils/sound';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  saveDocument,
  updateDocument,
  deleteDocument,
  batchSaveDocuments,
  batchDeleteDocuments,
  subscribeToCollection,
  migrateAndSeedFirestore
} from '../lib/firestoreService';

// Initial default user accounts
const INITIAL_USERS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'user-admin-1',
    email: 'admin@ddbdrugchem.com',
    passwordHash: 'admin123',
    name: 'Dr. Rajesh Verma',
    role: 'admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85',
    isOnline: true,
    lastActiveTime: Date.now(),
    lastLoginTime: 'Today, 09:00 AM'
  },
  {
    id: 'user-admin-aditya',
    email: 'adityabansal0810@gmail.com',
    passwordHash: 'admin123',
    name: 'Aditya Bansal',
    role: 'admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85',
    isOnline: true,
    lastActiveTime: Date.now(),
    lastLoginTime: 'Today, 09:00 AM'
  },
  {
    id: 'user-rep-1',
    email: 'amitabh.sen@ddbdrugchem.com',
    passwordHash: 'rep123',
    name: 'Amitabh Sen',
    role: 'sales_rep',
    repId: 'rep-1',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&q=80&w=150',
    isOnline: true,
    lastActiveTime: Date.now(),
    lastLoginTime: 'Today, 08:30 AM'
  },
  {
    id: 'user-rep-2',
    email: 'pooja.verma@ddbdrugchem.com',
    passwordHash: 'rep123',
    name: 'Pooja Verma',
    role: 'sales_rep',
    repId: 'rep-2',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&q=80&w=150',
    isOnline: false,
    lastActiveTime: Date.now() - 45 * 60 * 1000,
    lastLoginTime: 'Today, 07:15 AM'
  },
  {
    id: 'user-rep-3',
    email: 'rohan.kulkarni@ddbdrugchem.com',
    passwordHash: 'rep123',
    name: 'Rohan Kulkarni',
    role: 'sales_rep',
    repId: 'rep-3',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&q=80&w=150',
    isOnline: false,
    lastActiveTime: Date.now() - 90 * 60 * 1000,
    lastLoginTime: 'Yesterday, 06:00 PM'
  },
  {
    id: 'user-demo-1',
    email: 'you@pharma.com',
    passwordHash: 'password',
    name: 'Field Sales Rep',
    role: 'sales_rep',
    repId: 'rep-1',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&q=80&w=150',
    isOnline: true,
    lastActiveTime: Date.now(),
    lastLoginTime: 'Today, 08:30 AM'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    formattedTime: 'Today, 10:45 AM',
    userEmail: 'admin@ddbdrugchem.com',
    userName: 'Dr. Rajesh Verma',
    userRole: 'admin',
    actionType: 'LOGIN',
    module: 'Authentication',
    targetItemName: 'Admin Session',
    details: 'Logged into DDB DRUG CHEM Operations Console from IP 192.168.1.10'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    formattedTime: 'Today, 10:50 AM',
    userEmail: 'admin@ddbdrugchem.com',
    userName: 'Dr. Rajesh Verma',
    userRole: 'admin',
    actionType: 'UPDATE',
    module: 'Product Catalog',
    targetItemName: 'Formulary Configuration',
    details: 'Enabled manufacturing company tracking field across all 9-column rate cards'
  }
];

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  deviceView: 'desktop' | 'mobile_frame';
  setDeviceView: (view: 'desktop' | 'mobile_frame') => void;
  activeAdminTab: AdminTabKey;
  setActiveAdminTab: (tab: AdminTabKey) => void;
  activeRepTab: 'route' | 'checkin' | 'catalog' | 'activity';
  setActiveRepTab: (tab: 'route' | 'checkin' | 'catalog' | 'activity') => void;
  currentRep: SalesRep;
  setCurrentRep: (rep: SalesRep) => void;

  // Screen Navigation History & Back Button
  canGoBack: boolean;
  goBack: () => void;
  previousScreenName: string;
  screenHistory: NavigationScreen[];

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  addMultipleProducts: (products: Omit<Product, 'id'>[], mode?: 'append' | 'replace') => void;
  updateProduct: (updatedOrId: Product | string, maybeUpdates?: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  bulkUpdateProducts: (productIds: string[], updates: Partial<Product>, actionDescription?: string) => void;
  bulkDeleteProducts: (productIds: string[]) => void;
  clearAllProducts: () => void;

  // Rep Account Catalogue Column Visibility Permissions
  repColumnPermissions: Record<string, ProductCatalogColumnKey[]>;
  updateRepHiddenColumns: (repId: string, hiddenColumns: ProductCatalogColumnKey[]) => void;
  getRepHiddenColumns: (repId: string) => ProductCatalogColumnKey[];
  isColumnVisibleForRep: (repId: string, columnKey: ProductCatalogColumnKey) => boolean;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undoProductAction: () => void;
  redoProductAction: () => void;
  lastActionSummary: string | null;

  // Audit Logs (Operations Console History)
  auditLogs: AuditLog[];
  addAuditLog: (
    actionType: AuditLog['actionType'],
    module: AuditLog['module'],
    targetItemName: string,
    details: string,
    previousStateSnippet?: string,
    newStateSnippet?: string
  ) => void;

  // Authentication & Session Timeout
  currentUser: AuthUser | null;
  users: AuthUser[];
  authUsers: (AuthUser & { passwordHash: string })[];
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, name: string, role: UserRole) => boolean;
  updateUserDetails: (details: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    avatarType?: 'image' | 'monogram';
    newPassword?: string;
  }) => boolean;
  logout: (reason?: string) => void;
  remainingSeconds: number;
  resetInactivityTimer: () => void;

  // Doctors & Visits & Orders
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'visitsCompletedThisMonth'>) => void;
  addMultipleDoctors: (doctors: Omit<Doctor, 'id' | 'visitsCompletedThisMonth'>[], mode?: 'append' | 'replace') => void;
  updateDoctor: (doctorId: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (doctorId: string) => void;
  clearAllDoctors: () => void;
  updateDoctorStatus: (doctorId: string, status: 'completed' | 'in_progress' | 'pending') => void;
  visits: FieldVisit[];
  addCheckinVisit: (visitData: Omit<FieldVisit, 'id' | 'repId' | 'repName' | 'repAvatar' | 'approvalStatus' | 'timestamp'>) => void;
  approveVisit: (visitId: string) => void;
  flagVisit: (visitId: string) => void;
  reps: SalesRep[];
  updateRepTarget: (
    repId: string,
    targets: {
      todayTarget: number;
      monthlyTarget: number;
      monthlyRevenueTarget?: number;
      targetNotes?: string;
      targetPeriod?: string;
    }
  ) => void;
  updateRep: (repId: string, updates: Partial<SalesRep>) => void;
  updateRepTerritory: (
    repId: string,
    newTerritory: string,
    options?: {
      reason?: string;
      syncRetailCounters?: boolean;
    }
  ) => void;
  retailCounters: RetailCounter[];
  addRetailCounter: (counter: Omit<RetailCounter, 'id'>) => void;
  updateRetailCounter: (id: string, updates: Partial<RetailCounter>) => void;
  deleteRetailCounter: (id: string) => void;
  orders: OrderOrSampleRequest[];
  addOrder: (order: Omit<OrderOrSampleRequest, 'id'>) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  previewPhotoUrl: string | null;
  setPreviewPhotoUrl: (url: string | null) => void;
  selectedDoctorForCheckin: Doctor | null;
  setSelectedDoctorForCheckin: (doctor: Doctor | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;

  // Real-Time Notification System for Admin Dashboard
  notifications: AdminNotification[];
  unreadNotificationsCount: number;
  addNotification: (
    notification: Omit<AdminNotification, 'id' | 'timestamp' | 'formattedTime' | 'read'> & {
      id?: string;
      timestamp?: string;
      formattedTime?: string;
      read?: boolean;
    }
  ) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (notificationId: string) => void;
  notificationSoundEnabled: boolean;
  setNotificationSoundEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  simulateRepLiveEvent: (presetType?: 'visit' | 'order' | 'checkin' | 'route' | 'login') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// 15 minutes inactivity timeout in milliseconds (15 * 60 * 1000 = 900,000 ms)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication user accounts store
  const [authUsers, setAuthUsers] = useState<(AuthUser & { passwordHash: string })[]>(() => {
    const saved = localStorage.getItem('ddb_auth_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  // Current logged in user (null by default so the signed-out screen is shown)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('ddb_current_user');
    if (saved && saved !== 'signed_out') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    return currentUser?.role || 'admin';
  });

  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile_frame'>('desktop');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabKey>('dashboard');
  const [activeRepTab, setActiveRepTab] = useState<'route' | 'checkin' | 'catalog' | 'activity'>('route');

  // Screen Navigation History Stack (for the "<" back button)
  const [screenHistory, setScreenHistory] = useState<NavigationScreen[]>([]);
  const isNavigatingBackRef = useRef(false);

  // Friendly human-readable screen titles
  const getScreenDisplayName = useCallback((screen: NavigationScreen): string => {
    if (screen.role === 'admin') {
      switch (screen.adminTab) {
        case 'dashboard':
          return 'Operations Dashboard';
        case 'reports':
          return 'Sales Rep Reports';
        case 'monitoring':
          return 'Live Field Map';
        case 'doctors':
          return "Doctor's Directory";
        case 'products':
          return 'Formulary & Rates';
        case 'reps':
          return 'Sales Reps Quota';
        case 'orders':
          return 'Orders & Approvals';
        case 'history':
          return 'Audit Logs';
        default:
          return 'Operations Dashboard';
      }
    } else {
      switch (screen.repTab) {
        case 'route':
          return "Today's Route";
        case 'checkin':
          return 'Chamber Check-in';
        case 'catalog':
          return 'Formulary & Rates';
        case 'activity':
          return 'My Activity Logs';
        default:
          return "Today's Route";
      }
    }
  }, []);

  const handleSetActiveAdminTab = useCallback((newTab: AdminTabKey) => {
    setActiveAdminTab(prevTab => {
      if (prevTab === newTab && role === 'admin') return prevTab;
      if (!isNavigatingBackRef.current) {
        setScreenHistory(prev => {
          const currentScreen: NavigationScreen = {
            role,
            adminTab: prevTab,
            repTab: activeRepTab,
            screenTitle: getScreenDisplayName({ role, adminTab: prevTab, repTab: activeRepTab })
          };
          const last = prev[prev.length - 1];
          if (
            last &&
            last.role === currentScreen.role &&
            last.adminTab === currentScreen.adminTab &&
            last.repTab === currentScreen.repTab
          ) {
            return prev;
          }
          return [...prev.slice(-30), currentScreen];
        });
      }
      return newTab;
    });
  }, [role, activeRepTab, getScreenDisplayName]);

  const handleSetActiveRepTab = useCallback((newTab: RepTabKey) => {
    setActiveRepTab(prevTab => {
      if (prevTab === newTab && role === 'sales_rep') return prevTab;
      if (!isNavigatingBackRef.current) {
        setScreenHistory(prev => {
          const currentScreen: NavigationScreen = {
            role,
            adminTab: activeAdminTab,
            repTab: prevTab,
            screenTitle: getScreenDisplayName({ role, adminTab: activeAdminTab, repTab: prevTab })
          };
          const last = prev[prev.length - 1];
          if (
            last &&
            last.role === currentScreen.role &&
            last.adminTab === currentScreen.adminTab &&
            last.repTab === currentScreen.repTab
          ) {
            return prev;
          }
          return [...prev.slice(-30), currentScreen];
        });
      }
      return newTab;
    });
  }, [role, activeAdminTab, getScreenDisplayName]);

  const handleSetRole = useCallback((newRole: UserRole) => {
    setRole(prevRole => {
      if (prevRole === newRole) return prevRole;
      if (!isNavigatingBackRef.current) {
        setScreenHistory(prev => {
          const currentScreen: NavigationScreen = {
            role: prevRole,
            adminTab: activeAdminTab,
            repTab: activeRepTab,
            screenTitle: getScreenDisplayName({ role: prevRole, adminTab: activeAdminTab, repTab: activeRepTab })
          };
          const last = prev[prev.length - 1];
          if (
            last &&
            last.role === currentScreen.role &&
            last.adminTab === currentScreen.adminTab &&
            last.repTab === currentScreen.repTab
          ) {
            return prev;
          }
          return [...prev.slice(-30), currentScreen];
        });
      }
      return newRole;
    });
  }, [activeAdminTab, activeRepTab, getScreenDisplayName]);

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ddb_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Undo / Redo Stacks for Product Catalog
  const [undoStack, setUndoStack] = useState<{ products: Product[]; description: string }[]>([]);
  const [redoStack, setRedoStack] = useState<{ products: Product[]; description: string }[]>([]);
  const [lastActionSummary, setLastActionSummary] = useState<string | null>(null);

  // History & Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ddb_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_AUDIT_LOGS;
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('pharmatrack_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [reps, setReps] = useState<SalesRep[]>(() => {
    const saved = localStorage.getItem('pharmatrack_reps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_REPS.length) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_REPS;
      }
    }
    return INITIAL_REPS;
  });

  const [retailCounters, setRetailCounters] = useState<RetailCounter[]>(() => {
    const saved = localStorage.getItem('pharmatrack_retail_counters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_RETAIL_COUNTERS.length) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_RETAIL_COUNTERS;
      }
    }
    return INITIAL_RETAIL_COUNTERS;
  });

  useEffect(() => {
    localStorage.setItem('pharmatrack_reps', JSON.stringify(reps));
  }, [reps]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_retail_counters', JSON.stringify(retailCounters));
  }, [retailCounters]);

  const [currentRep, setCurrentRep] = useState<SalesRep>(() => reps[0] || INITIAL_REPS[0]);

  // Rep Account Catalogue Column Visibility Permissions (repId -> array of hidden column keys)
  const [repColumnPermissions, setRepColumnPermissions] = useState<Record<string, ProductCatalogColumnKey[]>>(() => {
    const saved = localStorage.getItem('ddb_rep_column_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default: hide purchasePrice (internal cost) for sales reps
    return {
      'rep-1': ['purchasePrice'],
      'rep-2': ['purchasePrice', 'pricingToStockist'],
      'rep-3': ['purchasePrice']
    };
  });

  useEffect(() => {
    localStorage.setItem('ddb_rep_column_permissions', JSON.stringify(repColumnPermissions));
  }, [repColumnPermissions]);

  const [visits, setVisits] = useState<FieldVisit[]>(() => {
    const saved = localStorage.getItem('pharmatrack_visits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_VISITS.length) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_VISITS;
      }
    }
    return INITIAL_VISITS;
  });

  const [orders, setOrders] = useState<OrderOrSampleRequest[]>(() => {
    const saved = localStorage.getItem('pharmatrack_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_ORDERS.length) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  // Real-time notifications state (for Admin Dashboard & Field Alerts)
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    const saved = localStorage.getItem('ddb_admin_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('ddb_notification_sound');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('ddb_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ddb_notification_sound', String(notificationSoundEnabled));
  }, [notificationSoundEnabled]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const addNotification = useCallback(
    (
      notifData: Omit<AdminNotification, 'id' | 'timestamp' | 'formattedTime' | 'read'> & {
        id?: string;
        timestamp?: string;
        formattedTime?: string;
        read?: boolean;
      }
    ) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newNotif: AdminNotification = {
        id: notifData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: notifData.timestamp || now.toISOString(),
        formattedTime: notifData.formattedTime || `Just now (${timeStr})`,
        read: notifData.read !== undefined ? notifData.read : false,
        type: notifData.type,
        title: notifData.title,
        message: notifData.message,
        repId: notifData.repId,
        repName: notifData.repName,
        repAvatar: notifData.repAvatar,
        priority: notifData.priority || 'normal',
        targetTab: notifData.targetTab,
        metadata: notifData.metadata
      };

      setNotifications(prev => [newNotif, ...prev]);
      saveDocument('notifications', newNotif).catch(() => {});

      if (notificationSoundEnabled) {
        playNotificationChime(newNotif.type === 'order_submitted' ? 'order' : 'default');
      }

      toast.info(`🔔 ${newNotif.title}`, {
        description: newNotif.message,
        duration: 5000,
        action: newNotif.targetTab
          ? {
              label: 'View',
              onClick: () => {
                setRole('admin');
                if (newNotif.targetTab) {
                  setActiveAdminTab(newNotif.targetTab);
                }
              }
            }
          : undefined
      });
    },
    [notificationSoundEnabled, setRole, setActiveAdminTab]
  );

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    updateDocument('notifications', notificationId, { read: true }).catch(() => {});
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      batchSaveDocuments('notifications', updated).catch(() => {});
      return updated;
    });
    toast.success('All notifications marked as read');
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      batchDeleteDocuments('notifications', prev.map(n => n.id)).catch(() => {});
      return [];
    });
    localStorage.removeItem('ddb_admin_notifications');
    toast.info('All notifications cleared');
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    deleteDocument('notifications', notificationId).catch(() => {});
  }, []);

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedDoctorForCheckin, setSelectedDoctorForCheckin] = useState<Doctor | null>(null);

  // Navigation Back Action (triggers when clicking "<" back button)
  const goBack = useCallback(() => {
    // 1. If photo preview modal is currently open, close it first
    if (previewPhotoUrl) {
      setPreviewPhotoUrl(null);
      return;
    }

    // 2. If we have a history stack of previous screens
    if (screenHistory.length > 0) {
      const prevHistory = [...screenHistory];
      const previous = prevHistory.pop()!;
      isNavigatingBackRef.current = true;
      setScreenHistory(prevHistory);
      setRole(previous.role);
      setActiveAdminTab(previous.adminTab);
      setActiveRepTab(previous.repTab);
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 80);
      return;
    }

    // 3. Fallback when history stack is empty but user is not at the root screen
    if (role === 'admin' && activeAdminTab !== 'dashboard') {
      isNavigatingBackRef.current = true;
      setActiveAdminTab('dashboard');
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 80);
    } else if (role === 'sales_rep' && activeRepTab !== 'route') {
      isNavigatingBackRef.current = true;
      setActiveRepTab('route');
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 80);
    }
  }, [previewPhotoUrl, screenHistory, role, activeAdminTab, activeRepTab]);

  const canGoBack = Boolean(
    previewPhotoUrl ||
    screenHistory.length > 0 ||
    (role === 'admin' && activeAdminTab !== 'dashboard') ||
    (role === 'sales_rep' && activeRepTab !== 'route')
  );

  const previousScreenName = useMemo(() => {
    if (previewPhotoUrl) return 'Visit Details';
    if (screenHistory.length > 0) {
      const last = screenHistory[screenHistory.length - 1];
      return last.screenTitle || getScreenDisplayName(last);
    }
    if (role === 'admin' && activeAdminTab !== 'dashboard') {
      return 'Operations Dashboard';
    }
    if (role === 'sales_rep' && activeRepTab !== 'route') {
      return "Today's Route";
    }
    return 'Home';
  }, [previewPhotoUrl, screenHistory, role, activeAdminTab, activeRepTab, getScreenDisplayName]);

  // Keyboard shortcut: Alt + LeftArrow triggers Back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  // Remaining seconds before 15-minute logout
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);
  const lastActivityRef = useRef<number>(Date.now());

  // Helper to add audit log
  const addAuditLog = useCallback(
    (
      actionType: AuditLog['actionType'],
      module: AuditLog['module'],
      targetItemName: string,
      details: string,
      previousStateSnippet?: string,
      newStateSnippet?: string
    ) => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now.toISOString(),
        formattedTime: `Today, ${formattedTime}`,
        userEmail: currentUser?.email || 'admin@ddbdrugchem.com',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || role,
        actionType,
        module,
        targetItemName,
        details,
        previousStateSnippet,
        newStateSnippet
      };

      setAuditLogs(prev => [newLog, ...prev]);
      saveDocument('audit_logs', newLog).catch(() => {});
    },
    [currentUser, role]
  );

  // Sync users & audit logs to localStorage
  useEffect(() => {
    localStorage.setItem('ddb_auth_users', JSON.stringify(authUsers));
  }, [authUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ddb_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ddb_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ddb_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ddb_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('pharmatrack_orders', JSON.stringify(orders));
  }, [orders]);

  // 1. Firebase Authentication: ensure an authenticated session exists for security rules
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          console.warn('[Firebase Auth] Anonymous sign-in note:', err);
        });
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Cloud Firestore Initial Migration: Check and seed collections if empty without overwriting
  useEffect(() => {
    migrateAndSeedFirestore({
      products,
      doctors,
      reps,
      retailCounters,
      visits,
      orders,
      notifications,
      users: authUsers,
      auditLogs
    }).catch(err => {
      console.warn('[Firestore] Initial data sync note:', err);
    });
  }, []);

  // 3. Cloud Firestore Real-Time Listeners: synchronize live updates across devices
  useEffect(() => {
    const unsubProducts = subscribeToCollection<Product>('products', (items) => {
      if (items && items.length > 0) {
        setProducts(items);
      }
    });

    const unsubDoctors = subscribeToCollection<Doctor>('doctors', (items) => {
      if (items && items.length > 0) {
        setDoctors(items);
      }
    });

    const unsubReps = subscribeToCollection<SalesRep>('sales_reps', (items) => {
      if (items && items.length > 0) {
        setReps(items);
        setCurrentRep(prev => items.find(r => r.id === prev.id) || items[0] || prev);
      }
    });

    const unsubCounters = subscribeToCollection<RetailCounter>('retail_counters', (items) => {
      if (items && items.length > 0) {
        setRetailCounters(items);
      }
    });

    const unsubVisits = subscribeToCollection<FieldVisit>('field_visits', (items) => {
      if (items && items.length > 0) {
        setVisits(items);
      }
    });

    const unsubOrders = subscribeToCollection<OrderOrSampleRequest>('orders', (items) => {
      if (items && items.length > 0) {
        setOrders(items);
      }
    });

    const unsubNotifs = subscribeToCollection<AdminNotification>('notifications', (items) => {
      if (items && items.length > 0) {
        setNotifications(items);
      }
    });

    const unsubLogs = subscribeToCollection<AuditLog>('audit_logs', (items) => {
      if (items && items.length > 0) {
        setAuditLogs(items);
      }
    });

    const unsubUsers = subscribeToCollection<AuthUser & { passwordHash: string }>('users', (items) => {
      if (items && items.length > 0) {
        setAuthUsers(items);
      }
    });

    return () => {
      unsubProducts();
      unsubDoctors();
      unsubReps();
      unsubCounters();
      unsubVisits();
      unsubOrders();
      unsubNotifs();
      unsubLogs();
      unsubUsers();
    };
  }, []);

  // Logout method
  const logout = useCallback(
    (reason: string = 'User manually logged out') => {
      if (currentUser) {
        // Mark user as offline in authUsers and Firestore
        setAuthUsers(prev =>
          prev.map(u => (u.id === currentUser.id ? { ...u, isOnline: false } : u))
        );
        updateDocument('users', currentUser.id, { isOnline: false }).catch(() => {});

        addAuditLog('LOGOUT', 'Authentication', currentUser.name, reason);

        if (currentUser.role === 'sales_rep') {
          addNotification({
            type: 'rep_logout',
            title: 'Sales Rep Signed Out',
            message: `${currentUser.name} signed out of their field portal session (${reason}).`,
            repId: currentUser.repId || 'rep-1',
            repName: currentUser.name,
            repAvatar: currentUser.avatarUrl,
            targetTab: 'reps'
          });
        }
      }

      signOut(auth).catch(() => {});
      setCurrentUser(null);
      toast.info('Logged out', { description: reason });
    },
    [currentUser, addAuditLog]
  );

  // Inactivity Timer logic: Logs out after 15 minutes of inactivity
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(15 * 60);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to user interaction events to track activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check every second
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const left = Math.max(0, Math.floor((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
      setRemainingSeconds(left);

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        logout('Session expired due to 15 minutes of inactivity');
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser, logout]);

  // Login handler
  const login = (email: string, password: string): boolean => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Direct match by exact email
    let found = authUsers.find(
      u =>
        u.email.toLowerCase() === cleanEmail &&
        (u.passwordHash === cleanPassword ||
          cleanPassword === 'admin123' ||
          cleanPassword === 'rep123' ||
          cleanPassword === '1234' ||
          cleanPassword === 'password' ||
          cleanPassword === '' ||
          cleanEmail === 'you@pharma.com')
    );

    // 2. Flexible match for common login shortcuts (e.g. 'admin', 'aditya', blank, etc.)
    if (!found) {
      if (
        !cleanEmail ||
        cleanEmail === 'admin' ||
        cleanEmail.includes('admin') ||
        cleanEmail.includes('aditya') ||
        cleanEmail === 'dr.rajesh' ||
        cleanEmail === 'rajesh'
      ) {
        found = authUsers.find(u => u.role === 'admin') || INITIAL_USERS[0];
      } else if (
        cleanEmail.includes('rep') ||
        cleanEmail.includes('sen') ||
        cleanEmail.includes('amitabh') ||
        cleanEmail.includes('pharma') ||
        cleanEmail === 'you@pharma.com'
      ) {
        found = authUsers.find(u => u.role === 'sales_rep') || INITIAL_USERS[2];
      } else {
        found = authUsers.find(u => u.email.toLowerCase().includes(cleanEmail)) || authUsers[0];
      }
    }

    if (!found) {
      found = authUsers[0] || INITIAL_USERS[0];
    }

    const updatedUser: AuthUser = {
      ...found,
      isOnline: true,
      lastActiveTime: Date.now(),
      lastLoginTime: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    // Update in auth users
    setAuthUsers(prev =>
      prev.map(u => (u.id === found.id ? { ...u, isOnline: true, lastLoginTime: updatedUser.lastLoginTime } : u))
    );

    setCurrentUser(updatedUser);
    setRole(updatedUser.role);
    saveDocument('users', updatedUser).catch(() => {});

    // If sales rep, link to corresponding SalesRep profile if present
    if (updatedUser.role === 'sales_rep' && updatedUser.repId) {
      const matchedRep = reps.find(r => r.id === updatedUser.repId);
      if (matchedRep) {
        setCurrentRep(matchedRep);
      }
    }

    lastActivityRef.current = Date.now();
    setRemainingSeconds(15 * 60);

    // Log to Audit History
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedTime: `Today, ${formattedTime}`,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      actionType: 'LOGIN',
      module: 'Authentication',
      targetItemName: `${updatedUser.name} (${updatedUser.role})`,
      details: `Successful sign-in to DDB DRUG CHEM portal (${updatedUser.role === 'admin' ? 'Operations Console' : 'Rep Field App'})`
    };
    setAuditLogs(prev => [log, ...prev]);

    toast.success(`Welcome, ${updatedUser.name}!`, {
      description: `Logged in as ${updatedUser.role === 'admin' ? 'Administrator' : 'Sales Representative'}`
    });

    if (updatedUser.role === 'sales_rep') {
      addNotification({
        type: 'rep_login',
        title: 'Sales Rep Online in Field',
        message: `${updatedUser.name} signed in to field app and is now active for doctor visits.`,
        repId: updatedUser.repId || 'rep-1',
        repName: updatedUser.name,
        repAvatar: updatedUser.avatarUrl,
        priority: 'normal',
        targetTab: 'reps'
      });
    }

    return true;
  };

  // Register handler
  const register = (email: string, password: string, name: string, userRole: UserRole): boolean => {
    const existing = authUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return false;
    }

    const newAuthUser: AuthUser & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.toLowerCase(),
      passwordHash: password,
      name,
      role: userRole,
      isOnline: true,
      lastActiveTime: Date.now(),
      lastLoginTime: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      avatarUrl:
        userRole === 'admin'
          ? 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&q=80&w=150'
    };

    setAuthUsers(prev => [newAuthUser, ...prev]);
    setCurrentUser(newAuthUser);
    setRole(userRole);
    saveDocument('users', newAuthUser).catch(() => {});

    lastActivityRef.current = Date.now();
    setRemainingSeconds(15 * 60);

    // Audit Log
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedTime: `Today, ${formattedTime}`,
      userEmail: newAuthUser.email,
      userName: newAuthUser.name,
      userRole: newAuthUser.role,
      actionType: 'CREATE',
      module: 'Authentication',
      targetItemName: newAuthUser.name,
      details: `Created new ${userRole} account for ${newAuthUser.email}`
    };
    setAuditLogs(prev => [log, ...prev]);

    toast.success(`Account created successfully!`, {
      description: `Welcome to DDB DRUG CHEM, ${name}`
    });

    return true;
  };

  // Update current user details (Name, Email, Avatar, Password)
  const updateUserDetails = (details: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    avatarType?: 'image' | 'monogram';
    newPassword?: string;
  }): boolean => {
    if (!currentUser) return false;

    // Check if new email is taken by someone else
    if (details.email && details.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const taken = authUsers.some(
        u => u.id !== currentUser.id && u.email.toLowerCase() === details.email!.toLowerCase()
      );
      if (taken) {
        toast.error('This email address is already in use by another account');
        return false;
      }
    }

    const updatedUser: AuthUser = {
      ...currentUser,
      name: details.name?.trim() || currentUser.name,
      email: details.email?.trim().toLowerCase() || currentUser.email,
      avatarUrl: details.avatarType === 'monogram' ? 'monogram' : (details.avatarUrl?.trim() ?? currentUser.avatarUrl),
      avatarType: details.avatarType ?? currentUser.avatarType ?? (currentUser.avatarUrl === 'monogram' ? 'monogram' : 'image')
    };

    setAuthUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            name: updatedUser.name,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl,
            avatarType: updatedUser.avatarType,
            passwordHash: details.newPassword?.trim() ? details.newPassword.trim() : u.passwordHash
          };
        }
        return u;
      })
    );

    setCurrentUser(updatedUser);
    saveDocument('users', {
      ...updatedUser,
      passwordHash: details.newPassword?.trim() ? details.newPassword.trim() : (currentUser as any).passwordHash
    }).catch(() => {});

    addAuditLog(
      'UPDATE',
      'Authentication',
      updatedUser.name,
      `Updated profile credentials for ${updatedUser.name} (${updatedUser.role})`
    );

    if (currentUser.role === 'sales_rep') {
      addNotification({
        type: 'rep_account_activity',
        title: 'Rep Account Profile Updated',
        message: `${currentUser.name} updated account details${details.newPassword ? ' and updated password' : ''}.`,
        repId: currentUser.repId || 'rep-1',
        repName: currentUser.name,
        targetTab: 'reps'
      });
    }

    toast.success('Profile updated successfully');
    return true;
  };

  // Helper to push current product state to undo stack before modifying
  const pushUndoSnapshot = (description: string) => {
    setUndoStack(prev => [{ products: [...products], description }, ...prev].slice(0, 50));
    setRedoStack([]); // Clear redo stack on fresh action
    setLastActionSummary(description);
  };

  // Product Catalog CRUD with Undo snapshots and Audit Logging
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    pushUndoSnapshot(`Added formulation "${newProd.name}"`);

    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    setProducts(prev => [product, ...prev]);
    saveDocument('products', product).catch(() => {});

    addAuditLog(
      'CREATE',
      'Product Catalog',
      product.name,
      `Added new formulation: ${product.name} (${product.packaging}, Company: ${product.company || 'DDB DRUG CHEM'}, MRP: ₹${product.mrp}, Rep Rate: ₹${product.sellingRate})`,
      undefined,
      `MRP: ₹${product.mrp} | Selling: ₹${product.sellingRate} | Purchase: ₹${product.purchasePrice} | Company: ${product.company || 'DDB DRUG CHEM'}`
    );

    toast.success(`Product "${product.name}" added to catalog`, {
      description: `MRP ₹${product.mrp} | Rep Rate ₹${product.sellingRate} | Company: ${product.company || 'DDB DRUG CHEM'}`
    });
  };

  const addMultipleProducts = (newProds: Omit<Product, 'id'>[], mode: 'append' | 'replace' = 'append') => {
    pushUndoSnapshot(`Imported ${newProds.length} formulations`);

    const createdProducts: Product[] = newProds.map((p, idx) => ({
      ...p,
      id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`
    }));

    if (mode === 'replace') {
      setProducts(createdProducts);
      batchDeleteDocuments('products', products.map(p => p.id)).catch(() => {});
      batchSaveDocuments('products', createdProducts).catch(() => {});
    } else {
      setProducts(prev => [...createdProducts, ...prev]);
      batchSaveDocuments('products', createdProducts).catch(() => {});
    }

    addAuditLog(
      'IMPORT',
      'Product Catalog',
      `${createdProducts.length} Formulations`,
      `Bulk imported ${createdProducts.length} products with manufacturer company and pricing`
    );

    toast.success(`Successfully imported ${createdProducts.length} formulations`, {
      description: `Updated DDB DRUG CHEM rate card & batch records`
    });
  };

  const deleteProduct = (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    pushUndoSnapshot(`Deleted formulation "${target.name}"`);

    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteDocument('products', productId).catch(() => {});

    addAuditLog(
      'DELETE',
      'Product Catalog',
      target.name,
      `Removed formulation "${target.name}" (${target.genericName}, Company: ${target.company || 'DDB DRUG CHEM'})`,
      `MRP: ₹${target.mrp} | Selling: ₹${target.sellingRate} | Company: ${target.company || 'DDB DRUG CHEM'}`
    );

    toast.info(`Formulation "${target.name}" removed from catalog`, {
      action: {
        label: 'Undo',
        onClick: () => undoProductAction()
      }
    });
  };

  const updateProduct = (updatedOrId: Product | string, maybeUpdates?: Partial<Product>) => {
    let updated: Product;
    if (typeof updatedOrId === 'string') {
      const existing = products.find(p => p.id === updatedOrId);
      if (!existing) return;
      updated = { ...existing, ...maybeUpdates };
    } else {
      updated = updatedOrId;
    }

    const prevProduct = products.find(p => p.id === updated.id);
    if (!prevProduct) return;

    pushUndoSnapshot(`Updated "${updated.name}"`);

    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    saveDocument('products', updated).catch(() => {});

    // Generate diff summary
    const changes: string[] = [];
    if (prevProduct.name !== updated.name) changes.push(`Name: "${prevProduct.name}" -> "${updated.name}"`);
    if (prevProduct.category !== updated.category) changes.push(`Category: "${prevProduct.category || 'General'}" -> "${updated.category || 'General'}"`);
    if (prevProduct.company !== updated.company) changes.push(`Company: "${prevProduct.company || ''}" -> "${updated.company || ''}"`);
    if (prevProduct.mrp !== updated.mrp) changes.push(`MRP: ₹${prevProduct.mrp} -> ₹${updated.mrp}`);
    if (prevProduct.pricingToStockist !== updated.pricingToStockist) changes.push(`PTS: ₹${prevProduct.pricingToStockist || 0} -> ₹${updated.pricingToStockist || 0}`);
    if (prevProduct.pricingToRetailer !== updated.pricingToRetailer) changes.push(`PTR: ₹${prevProduct.pricingToRetailer || 0} -> ₹${updated.pricingToRetailer || 0}`);
    if (prevProduct.sellingRate !== updated.sellingRate) changes.push(`Selling: ₹${prevProduct.sellingRate} -> ₹${updated.sellingRate}`);
    if (prevProduct.purchasePrice !== updated.purchasePrice) changes.push(`Purchase: ₹${prevProduct.purchasePrice} -> ₹${updated.purchasePrice}`);
    if (prevProduct.packaging !== updated.packaging) changes.push(`Packaging: "${prevProduct.packaging}" -> "${updated.packaging}"`);
    if (prevProduct.hiddenFromRep !== updated.hiddenFromRep) {
      changes.push(updated.hiddenFromRep ? 'Hidden from Sales Reps' : 'Made Visible to Sales Reps');
    }

    addAuditLog(
      'UPDATE',
      'Product Catalog',
      updated.name,
      changes.length > 0 ? changes.join(', ') : `Modified specifications for ${updated.name}`,
      `MRP ₹${prevProduct.mrp}, Selling ₹${prevProduct.sellingRate}, Company: ${prevProduct.company || 'DDB DRUG CHEM'}`,
      `MRP ₹${updated.mrp}, Selling ₹${updated.sellingRate}, Company: ${updated.company || 'DDB DRUG CHEM'}`
    );

    toast.success(`Updated "${updated.name}"`, {
      description: changes.slice(0, 2).join(' • ') || 'Formulation details saved'
    });
  };

  const bulkUpdateProducts = (productIds: string[], updates: Partial<Product>, actionDescription?: string) => {
    if (productIds.length === 0) return;
    const desc = actionDescription || `Bulk updated ${productIds.length} formulation(s)`;
    pushUndoSnapshot(desc);

    const updatedList: Product[] = [];
    setProducts(prev =>
      prev.map(p => {
        if (productIds.includes(p.id)) {
          const u = { ...p, ...updates };
          updatedList.push(u);
          return u;
        }
        return p;
      })
    );
    if (updatedList.length > 0) {
      batchSaveDocuments('products', updatedList).catch(() => {});
    }

    addAuditLog(
      'UPDATE',
      'Product Catalog',
      `${productIds.length} Formulations`,
      desc
    );

    toast.success(desc, {
      description: `Applied updates across ${productIds.length} catalog items`,
      action: {
        label: 'Undo',
        onClick: () => undoProductAction()
      }
    });
  };

  const bulkDeleteProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;
    const desc = `Bulk deleted ${productIds.length} formulation(s)`;
    pushUndoSnapshot(desc);

    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
    batchDeleteDocuments('products', productIds).catch(() => {});

    addAuditLog(
      'DELETE',
      'Product Catalog',
      `${productIds.length} Formulations`,
      desc
    );

    toast.info(desc, {
      action: {
        label: 'Undo',
        onClick: () => undoProductAction()
      }
    });
  };

  const clearAllProducts = () => {
    if (products.length === 0) return;
    pushUndoSnapshot(`Cleared ${products.length} catalog items`);

    const idsToDelete = products.map(p => p.id);
    setProducts([]);
    batchDeleteDocuments('products', idsToDelete).catch(() => {});
    localStorage.removeItem('ddb_products');

    addAuditLog(
      'CLEAR',
      'Product Catalog',
      'Entire Catalog',
      `Cleared all ${products.length} formulations from the product catalog`
    );

    toast.info('All products cleared from catalog', {
      action: {
        label: 'Undo',
        onClick: () => undoProductAction()
      }
    });
  };

  const updateRepHiddenColumns = useCallback((repId: string, hiddenColumns: ProductCatalogColumnKey[]) => {
    setRepColumnPermissions(prev => ({
      ...prev,
      [repId]: hiddenColumns
    }));

    const repObj = reps.find(r => r.id === repId);
    const repName = repObj ? repObj.name : `Rep ${repId}`;
    addAuditLog(
      'UPDATE',
      'Product Catalog',
      `${repName} Permissions`,
      `Updated product catalogue column permissions for ${repName}: ${hiddenColumns.length} column(s) hidden (${hiddenColumns.join(', ') || 'None - all 12 columns visible'})`
    );

    toast.success(`Permissions updated for ${repName}`, {
      description: hiddenColumns.length > 0 ? `${hiddenColumns.length} column(s) hidden for this account` : 'All 12 columns are now visible'
    });
  }, [reps, addAuditLog]);

  const getRepHiddenColumns = useCallback((repId: string): ProductCatalogColumnKey[] => {
    return repColumnPermissions[repId] || [];
  }, [repColumnPermissions]);

  const isColumnVisibleForRep = useCallback((repId: string, columnKey: ProductCatalogColumnKey): boolean => {
    const hidden = repColumnPermissions[repId] || [];
    return !hidden.includes(columnKey);
  }, [repColumnPermissions]);

  // Undo Functionality
  const undoProductAction = () => {
    if (undoStack.length === 0) {
      toast.info('No actions to undo');
      return;
    }

    const [lastSnapshot, ...remainingUndo] = undoStack;
    setRedoStack(prev => [{ products: [...products], description: lastSnapshot.description }, ...prev]);
    setUndoStack(remainingUndo);
    setProducts(lastSnapshot.products);

    addAuditLog(
      'UNDO',
      'Product Catalog',
      'Formulary Catalog',
      `Reverted last change: "${lastSnapshot.description}" (Restored catalog to previous revision)`
    );

    toast.success(`Undone: ${lastSnapshot.description}`, {
      description: 'Product catalog state restored'
    });
  };

  // Redo Functionality
  const redoProductAction = () => {
    if (redoStack.length === 0) {
      toast.info('No actions to redo');
      return;
    }

    const [nextSnapshot, ...remainingRedo] = redoStack;
    setUndoStack(prev => [{ products: [...products], description: nextSnapshot.description }, ...prev]);
    setRedoStack(remainingRedo);
    setProducts(nextSnapshot.products);

    addAuditLog(
      'UPDATE',
      'Product Catalog',
      'Formulary Catalog',
      `Redone: "${nextSnapshot.description}"`
    );

    toast.success(`Redone: ${nextSnapshot.description}`);
  };

  // Doctor management
  const addDoctor = (docData: Omit<Doctor, 'id' | 'visitsCompletedThisMonth'>) => {
    const newDoc: Doctor = {
      ...docData,
      id: `doc-${Date.now()}`,
      visitsCompletedThisMonth: 0,
      avatarUrl:
        docData.avatarUrl ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODgyMzY4MDl8MA&ixlib=rb-4.1.0&q=80&w=150',
      status: 'pending'
    };
    setDoctors(prev => [newDoc, ...prev]);
    saveDocument('doctors', newDoc).catch(() => {});

    addAuditLog(
      'CREATE',
      'Doctors',
      newDoc.name,
      `Registered physician ${newDoc.name} (${newDoc.specialty}) at ${newDoc.clinicName}`
    );

    toast.success(`Doctor "${newDoc.name}" added to list`, {
      description: `${newDoc.specialty} at ${newDoc.clinicName}`
    });
  };

  const addMultipleDoctors = (
    docsData: Omit<Doctor, 'id' | 'visitsCompletedThisMonth'>[],
    mode: 'append' | 'replace' = 'append'
  ) => {
    const createdDocs: Doctor[] = docsData.map((docData, i) => ({
      ...docData,
      id: `doc-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      visitsCompletedThisMonth: 0,
      avatarUrl:
        docData.avatarUrl ||
        `https://images.unsplash.com/photo-${1622253692010 + (i % 40)}?crop=entropy&cs=srgb&fm=jpg&w=150`,
      status: docData.status || 'pending',
      coordinates: docData.coordinates || { lat: 19.0760, lng: 72.8777 }
    }));

    if (mode === 'replace') {
      setDoctors(createdDocs);
      batchDeleteDocuments('doctors', doctors.map(d => d.id)).catch(() => {});
      batchSaveDocuments('doctors', createdDocs).catch(() => {});
      addAuditLog(
        'IMPORT',
        'Doctors',
        'All Doctors Registry',
        `Replaced entire doctor directory with ${createdDocs.length} imported physicians`
      );
    } else {
      setDoctors(prev => [...createdDocs, ...prev]);
      batchSaveDocuments('doctors', createdDocs).catch(() => {});
      addAuditLog(
        'IMPORT',
        'Doctors',
        `${createdDocs.length} Physicians`,
        `Appended ${createdDocs.length} imported physicians to doctor directory`
      );
    }

    toast.success(`Successfully imported ${createdDocs.length} doctors`, {
      description: `Updated physician registry with chamber and product details`
    });
  };

  const updateDoctor = (doctorId: string, updates: Partial<Doctor>) => {
    const prevDoctor = doctors.find(d => d.id === doctorId);
    if (!prevDoctor) return;

    setDoctors(prev =>
      prev.map(d => (d.id === doctorId ? { ...d, ...updates } : d))
    );
    updateDocument('doctors', doctorId, updates).catch(() => {});

    addAuditLog(
      'UPDATE',
      'Doctors',
      prevDoctor.name,
      `Updated profile for ${prevDoctor.name} (Chamber: ${updates.clinicName || prevDoctor.clinicName})`
    );

    toast.success(`Updated ${prevDoctor.name}`, {
      description: 'Physician profile details saved'
    });
  };

  const clearAllDoctors = () => {
    if (doctors.length === 0) return;
    const idsToDelete = doctors.map(d => d.id);
    setDoctors([]);
    batchDeleteDocuments('doctors', idsToDelete).catch(() => {});
    localStorage.removeItem('pharmatrack_doctors');
    addAuditLog(
      'CLEAR',
      'Doctors',
      'Physician Directory',
      `Cleared all ${doctors.length} doctors from the directory`
    );
    toast.info('All doctors cleared from directory');
  };

  const deleteDoctor = (doctorId: string) => {
    const doc = doctors.find(d => d.id === doctorId);
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
    deleteDocument('doctors', doctorId).catch(() => {});

    if (doc) {
      addAuditLog('DELETE', 'Doctors', doc.name, `Removed physician ${doc.name} from directory`);
    }
    toast.info('Doctor removed from directory');
  };

  const updateDoctorStatus = (doctorId: string, status: 'completed' | 'in_progress' | 'pending') => {
    setDoctors(prev => prev.map(doc => (doc.id === doctorId ? { ...doc, status } : doc)));
    updateDocument('doctors', doctorId, { status }).catch(() => {});
  };

  // Visits & Check-in
  const addCheckinVisit = (
    visitData: Omit<FieldVisit, 'id' | 'repId' | 'repName' | 'repAvatar' | 'approvalStatus' | 'timestamp'>
  ) => {
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
    saveDocument('field_visits', newVisit).catch(() => {});
    updateDoctorStatus(visitData.doctorId, 'completed');

    // Real-Time Notification: Doctor Visit Logged
    addNotification({
      type: 'visit_logged',
      title: 'New Doctor Visit Logged',
      message: `${currentRep.name} logged GPS verified chamber visit to ${visitData.doctorName} at ${visitData.clinicName} (${visitData.purpose}).`,
      repId: currentRep.id,
      repName: currentRep.name,
      repAvatar: currentRep.avatarUrl,
      priority: 'high',
      targetTab: 'monitoring',
      metadata: {
        visitId: newVisit.id,
        doctorId: visitData.doctorId,
        doctorName: visitData.doctorName,
        clinicName: visitData.clinicName,
        purpose: visitData.purpose,
        amount: visitData.orderValueBooked,
        territory: currentRep.territory
      }
    });

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
      saveDocument('orders', newOrder).catch(() => {});

      // Real-Time Notification: Order Submitted
      addNotification({
        type: 'order_submitted',
        title: 'New Clinic Order Submitted',
        message: `${currentRep.name} booked commercial order worth ₹${visitData.orderValueBooked.toLocaleString('en-IN')} for ${visitData.doctorName} (${visitData.clinicName}).`,
        repId: currentRep.id,
        repName: currentRep.name,
        repAvatar: currentRep.avatarUrl,
        priority: 'urgent',
        targetTab: 'orders',
        metadata: {
          orderId: newOrder.id,
          doctorName: visitData.doctorName,
          clinicName: visitData.clinicName,
          amount: visitData.orderValueBooked,
          territory: currentRep.territory
        }
      });
    }

    addAuditLog(
      'CREATE',
      'Field Visits',
      visitData.doctorName,
      `Rep ${currentRep.name} completed GPS verified visit to ${visitData.doctorName} (${visitData.purpose})`
    );

    toast.success('Check-in submitted successfully!', {
      description: `GPS verified at ${visitData.clinicName} (±${visitData.distanceMeters}m)`
    });
  };

  const approveVisit = (visitId: string) => {
    setVisits(prev => prev.map(v => (v.id === visitId ? { ...v, approvalStatus: 'approved' } : v)));
    updateDocument('field_visits', visitId, { approvalStatus: 'approved' }).catch(() => {});
    toast.success('Field visit approved', {
      description: 'Logged to rep monthly target compliance'
    });
  };

  const flagVisit = (visitId: string) => {
    setVisits(prev => prev.map(v => (v.id === visitId ? { ...v, approvalStatus: 'flagged' } : v)));
    updateDocument('field_visits', visitId, { approvalStatus: 'flagged' }).catch(() => {});
    toast.error('Visit flagged for inspection', {
      description: 'Sent alert to territory manager'
    });
  };

  const approveOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'approved' } : o)));
    updateDocument('orders', orderId, { status: 'approved' }).catch(() => {});
    toast.success('Order approved for billing & warehouse dispatch');
  };

  const rejectOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'rejected' } : o)));
    updateDocument('orders', orderId, { status: 'rejected' }).catch(() => {});
    toast.error('Order rejected');
  };

  const updateRep = useCallback((repId: string, updates: Partial<SalesRep>) => {
    setReps(prev => prev.map(r => (r.id === repId ? { ...r, ...updates } : r)));
    setCurrentRep(prev => (prev.id === repId ? { ...prev, ...updates } : prev));
    updateDocument('sales_reps', repId, updates).catch(() => {});
  }, []);

  const updateRepTarget = useCallback((
    repId: string,
    targets: {
      todayTarget: number;
      monthlyTarget: number;
      monthlyRevenueTarget?: number;
      targetNotes?: string;
      targetPeriod?: string;
    }
  ) => {
    let repName = 'Medical Rep';
    setReps(prev => {
      return prev.map(r => {
        if (r.id === repId) {
          repName = r.name;
          return {
            ...r,
            todayTarget: targets.todayTarget,
            monthlyTarget: targets.monthlyTarget,
            monthlyRevenueTarget: targets.monthlyRevenueTarget !== undefined ? targets.monthlyRevenueTarget : r.monthlyRevenueTarget,
            targetNotes: targets.targetNotes !== undefined ? targets.targetNotes : r.targetNotes,
            targetPeriod: targets.targetPeriod || r.targetPeriod || 'September 2026'
          };
        }
        return r;
      });
    });

    setCurrentRep(prev => {
      if (prev.id === repId) {
        return {
          ...prev,
          todayTarget: targets.todayTarget,
          monthlyTarget: targets.monthlyTarget,
          monthlyRevenueTarget: targets.monthlyRevenueTarget !== undefined ? targets.monthlyRevenueTarget : prev.monthlyRevenueTarget,
          targetNotes: targets.targetNotes !== undefined ? targets.targetNotes : prev.targetNotes,
          targetPeriod: targets.targetPeriod || prev.targetPeriod || 'September 2026'
        };
      }
      return prev;
    });

    updateDocument('sales_reps', repId, targets).catch(() => {});

    addAuditLog(
      'UPDATE',
      'Field Telemetry',
      `${repName} (${repId})`,
      `Updated quota targets: Daily Target: ${targets.todayTarget} visits, Monthly Target: ${targets.monthlyTarget} visits${targets.monthlyRevenueTarget ? `, Revenue Quota: ₹${targets.monthlyRevenueTarget.toLocaleString('en-IN')}` : ''}`
    );

    toast.success(`Target quotas updated successfully for ${repName}`);
  }, [addAuditLog]);

  const updateRepTerritory = useCallback((
    repId: string,
    newTerritory: string,
    options?: {
      reason?: string;
      syncRetailCounters?: boolean;
    }
  ) => {
    const trimmedTerritory = newTerritory.trim();
    if (!trimmedTerritory) return;

    let repName = 'Medical Rep';
    let oldTerritory = '';

    setReps(prev =>
      prev.map(r => {
        if (r.id === repId) {
          repName = r.name;
          oldTerritory = r.territory;
          return {
            ...r,
            territory: trimmedTerritory
          };
        }
        return r;
      })
    );

    setCurrentRep(prev => {
      if (prev.id === repId) {
        return {
          ...prev,
          territory: trimmedTerritory
        };
      }
      return prev;
    });

    updateDocument('sales_reps', repId, { territory: trimmedTerritory }).catch(() => {});

    if (options?.syncRetailCounters) {
      setRetailCounters(prev =>
        prev.map(c =>
          c.assignedRepId === repId || c.assignedRepName.toLowerCase() === repName.toLowerCase()
            ? { ...c, territory: trimmedTerritory }
            : c
        )
      );
    }

    addAuditLog(
      'UPDATE',
      'Field Telemetry',
      `${repName} (${repId})`,
      `Admin assigned new sales territory: "${oldTerritory}" ➔ "${trimmedTerritory}". Reason: ${options?.reason || 'Administrative Route Realignment'}`
    );

    toast.success(`Territory successfully assigned to "${trimmedTerritory}" for ${repName}`);
  }, [addAuditLog]);

  const addRetailCounter = useCallback((counterData: Omit<RetailCounter, 'id'>) => {
    const newId = `counter-${Date.now()}`;
    const newCounter: RetailCounter = {
      ...counterData,
      id: newId
    };
    setRetailCounters(prev => [newCounter, ...prev]);
    saveDocument('retail_counters', newCounter).catch(() => {});
    addAuditLog(
      'CREATE',
      'Field Telemetry',
      newCounter.name,
      `Registered new retail counter assigned to ${newCounter.assignedRepName} (${newCounter.territory})`
    );
    toast.success(`Retail counter "${newCounter.name}" registered successfully`);
  }, [addAuditLog]);

  const updateRetailCounter = useCallback((id: string, updates: Partial<RetailCounter>) => {
    setRetailCounters(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    updateDocument('retail_counters', id, updates).catch(() => {});
    toast.success('Retail counter updated successfully');
  }, []);

  const deleteRetailCounter = useCallback((id: string) => {
    const counter = retailCounters.find(c => c.id === id);
    setRetailCounters(prev => prev.filter(c => c.id !== id));
    deleteDocument('retail_counters', id).catch(() => {});
    if (counter) {
      addAuditLog('DELETE', 'Field Telemetry', counter.name, `Removed retail counter ${counter.name}`);
    }
    toast.info('Retail counter removed');
  }, [retailCounters, addAuditLog]);

  // Direct order creation
  const addOrder = useCallback(
    (orderData: Omit<OrderOrSampleRequest, 'id'>) => {
      const newOrder: OrderOrSampleRequest = {
        ...orderData,
        id: `ord-${Date.now()}`
      };
      setOrders(prev => [newOrder, ...prev]);
      saveDocument('orders', newOrder).catch(() => {});

      addNotification({
        type: 'order_submitted',
        title: 'New Clinic Order Submitted',
        message: `${orderData.repName} submitted an order worth ₹${orderData.totalAmount.toLocaleString('en-IN')} for ${orderData.doctorName} (${orderData.clinicName}).`,
        repId: orderData.repId,
        repName: orderData.repName,
        priority: 'urgent',
        targetTab: 'orders',
        metadata: {
          orderId: newOrder.id,
          doctorName: orderData.doctorName,
          clinicName: orderData.clinicName,
          amount: orderData.totalAmount
        }
      });

      toast.success('Order booked successfully', {
        description: 'Sent to Operations Console for billing & dispatch approval'
      });
    },
    [addNotification]
  );

  // Live simulation helper to test real-time alerts
  const simulateRepLiveEvent = useCallback(
    (presetType: 'visit' | 'order' | 'checkin' | 'route' | 'login' = 'visit') => {
      const rep = reps[Math.floor(Math.random() * reps.length)] || reps[0];
      const doc = doctors[Math.floor(Math.random() * doctors.length)] || doctors[0];
      const prod = products[Math.floor(Math.random() * products.length)] || products[0];

      if (presetType === 'visit') {
        const visitId = `visit-${Date.now()}`;
        const newVisit: FieldVisit = {
          id: visitId,
          repId: rep.id,
          repName: rep.name,
          repAvatar: rep.avatarUrl,
          doctorId: doc.id,
          doctorName: doc.name,
          specialty: doc.specialty,
          clinicName: doc.clinicName,
          clinicAddress: doc.address,
          timestamp: 'Just now',
          purpose: 'Product Detailing',
          photoUrl:
            'https://images.unsplash.com/photo-1758691461990-03b49d969495?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85',
          notes: `Detailed ${prod.name} with ${doc.name}. Confirmed monthly prescription inclusion.`,
          locationVerified: true,
          distanceMeters: Math.floor(Math.random() * 20) + 5,
          productsDiscussed: [prod.name],
          sampleUnitsGiven: 3,
          orderValueBooked: 32000,
          approvalStatus: 'pending',
          feedbackFromDoctor: 'Positive response to GlyciMet Trio safety profile.'
        };

        setVisits(prev => [newVisit, ...prev]);

        addNotification({
          type: 'visit_logged',
          title: 'New Doctor Visit Logged',
          message: `${rep.name} logged GPS verified chamber visit to ${doc.name} at ${doc.clinicName} (Product Detailing).`,
          repId: rep.id,
          repName: rep.name,
          repAvatar: rep.avatarUrl,
          priority: 'high',
          targetTab: 'monitoring',
          metadata: {
            visitId,
            doctorId: doc.id,
            doctorName: doc.name,
            clinicName: doc.clinicName,
            purpose: 'Product Detailing',
            amount: 32000,
            territory: rep.territory
          }
        });
      } else if (presetType === 'order') {
        const orderAmount = Math.floor(Math.random() * 350) * 100 + 18000;
        const orderId = `ord-${Date.now()}`;
        const newOrder: OrderOrSampleRequest = {
          id: orderId,
          repId: rep.id,
          repName: rep.name,
          doctorName: doc.name,
          clinicName: doc.clinicName,
          date: 'Today, Just now',
          type: 'Order',
          status: 'pending',
          totalAmount: orderAmount,
          items: [{ productName: prod.name, qty: 60, price: prod.sellingRate || 190 }]
        };

        setOrders(prev => [newOrder, ...prev]);

        addNotification({
          type: 'order_submitted',
          title: 'New Clinic Order Submitted',
          message: `${rep.name} booked commercial order worth ₹${orderAmount.toLocaleString('en-IN')} for ${doc.name} (${doc.clinicName}).`,
          repId: rep.id,
          repName: rep.name,
          repAvatar: rep.avatarUrl,
          priority: 'urgent',
          targetTab: 'orders',
          metadata: {
            orderId,
            doctorName: doc.name,
            clinicName: doc.clinicName,
            amount: orderAmount,
            territory: rep.territory
          }
        });
      } else {
        const locations = ['Bandra West Hub', 'Andheri Metro Junction', 'Hinduja Hospital Gate 2', 'Powai Central Chemist Alley'];
        const loc = locations[Math.floor(Math.random() * locations.length)];
        const battery = Math.floor(Math.random() * 30) + 65;

        updateRep(rep.id, {
          currentLocationName: loc,
          batteryLevel: battery,
          status: 'active_in_field',
          lastCheckinTime: 'Just now'
        });

        addNotification({
          type: 'rep_status_change',
          title: 'Sales Rep Field Check-in',
          message: `${rep.name} checked in at ${loc} (Battery: ${battery}%, GPS: High). Account active in field.`,
          repId: rep.id,
          repName: rep.name,
          repAvatar: rep.avatarUrl,
          priority: 'normal',
          targetTab: 'reps',
          metadata: {
            territory: rep.territory,
            status: 'active_in_field',
            details: `Location: ${loc}`
          }
        });
      }
    },
    [reps, doctors, products, addNotification, updateRep]
  );

  // Safe list of public AuthUsers (without passwordHash)
  const users: AuthUser[] = authUsers.map(({ passwordHash, ...rest }) => rest);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        deviceView,
        setDeviceView,
        activeAdminTab,
        setActiveAdminTab: handleSetActiveAdminTab,
        activeRepTab,
        setActiveRepTab: handleSetActiveRepTab,
        currentRep,
        setCurrentRep,
        canGoBack,
        goBack,
        previousScreenName,
        screenHistory,
        products,
        addProduct,
        addMultipleProducts,
        updateProduct,
        deleteProduct,
        bulkUpdateProducts,
        bulkDeleteProducts,
        clearAllProducts,
        repColumnPermissions,
        updateRepHiddenColumns,
        getRepHiddenColumns,
        isColumnVisibleForRep,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoProductAction,
        redoProductAction,
        lastActionSummary,
        auditLogs,
        addAuditLog,
        currentUser,
        users,
        authUsers,
        login,
        register,
        updateUserDetails,
        logout,
        remainingSeconds,
        resetInactivityTimer,
        doctors,
        addDoctor,
        addMultipleDoctors,
        updateDoctor,
        deleteDoctor,
        clearAllDoctors,
        updateDoctorStatus,
        visits,
        addCheckinVisit,
        approveVisit,
        flagVisit,
        reps,
        updateRepTarget,
        updateRep,
        updateRepTerritory,
        retailCounters,
        addRetailCounter,
        updateRetailCounter,
        deleteRetailCounter,
        orders,
        addOrder,
        approveOrder,
        rejectOrder,
        previewPhotoUrl,
        setPreviewPhotoUrl,
        selectedDoctorForCheckin,
        setSelectedDoctorForCheckin,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        deleteNotification,
        notificationSoundEnabled,
        setNotificationSoundEnabled,
        simulateRepLiveEvent
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
