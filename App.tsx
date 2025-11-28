
import React, { useState, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AuditScreen from './components/AuditScreen';
import AuditListView from './components/AuditListView';
import IncidentList from './components/IncidentList';
import SopLibrary from './components/SopLibrary';
import AdminPanel from './components/AdminPanel';
import Collections from './components/Collections';
import ReportsView from './components/ReportsView';
import LoginScreen from './components/LoginScreen';
import ReportIncidentModal from './components/ReportIncidentModal';
// Ensure correct relative import
import { mockAudits, mockIncidents, mockSops, mockTemplates, mockCollections, MOCK_USERS } from './constants';
import type { Audit, Incident, View, NewIncidentData, SOP, AuditTemplate, Collection, User, IncidentActivity, IncidentStatus } from './types';
import { DefaultDepartments, AuditStatus } from './types';
import { dbAPI } from './utils/db';

import { DashboardIcon, ChecklistIcon, WarningIcon, BookIcon, AdminIcon, CollectionIcon, ReportsIcon } from './components/icons/NavIcons';

// Custom Hook for IndexedDB Persistence with Saving State
function usePersistentState<T>(key: string, defaultValue: T, storeType: 'store' | 'setting' = 'store'): [T, React.Dispatch<React.SetStateAction<T>>, boolean, boolean] {
    const [data, setData] = useState<T>(defaultValue);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load Data on Mount
    useEffect(() => {
        const load = async () => {
            try {
                let saved;
                if (storeType === 'store') {
                    saved = await dbAPI.getAll(key);
                    // If array comes back empty, treat as null so we use default value (mock data)
                    if (Array.isArray(saved) && saved.length === 0) saved = null;
                } else {
                    saved = await dbAPI.getSetting(key);
                }

                if (saved) {
                    setData(saved);
                }
            } catch (err) {
                console.error(`Error loading ${key} from DB:`, err);
            } finally {
                setIsLoaded(true);
            }
        };
        load();
    }, [key, storeType]);

    // Save Data on Change (only after initial load)
    useEffect(() => {
        if (!isLoaded) return;

        const save = async () => {
            setIsSaving(true);
            try {
                if (storeType === 'store' && Array.isArray(data)) {
                    await dbAPI.saveAll(key, data);
                } else {
                    await dbAPI.saveSetting(key, data);
                }
            } catch (err) {
                console.error(`Error saving ${key} to DB:`, err);
            } finally {
                // Short delay to let the user see "Saving..." if it was fast
                setTimeout(() => setIsSaving(false), 500);
            }
        };
        // Debounce slightly to avoid hammering DB on rapid keystrokes
        const handler = setTimeout(save, 800);
        return () => clearTimeout(handler);
    }, [data, isLoaded, key, storeType]);

    return [data, setData, isLoaded, isSaving];
}

// Hook to track online status
function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export default function App() {
  // Use persistent state with IndexedDB
  const [users, setUsers, usersLoaded, usersSaving] = usePersistentState<User[]>('users', MOCK_USERS, 'store');
  const [audits, setAudits, auditsLoaded, auditsSaving] = usePersistentState<Audit[]>('audits', mockAudits, 'store');
  const [incidents, setIncidents, incidentsLoaded, incidentsSaving] = usePersistentState<Incident[]>('incidents', mockIncidents, 'store');
  const [sops, setSops, sopsLoaded, sopsSaving] = usePersistentState<SOP[]>('sops', mockSops, 'store');
  const [templates, setTemplates, templatesLoaded, templatesSaving] = usePersistentState<AuditTemplate[]>('templates', mockTemplates, 'store');
  const [collections, setCollections, collectionsLoaded, collectionsSaving] = usePersistentState<Collection[]>('collections', mockCollections, 'store');
  
  const [hotels, setHotels, hotelsLoaded, hotelsSaving] = usePersistentState<string[]>('hotels', ['Grand Plaza Hotel', 'Seaside Resort'], 'setting');
  const [departments, setDepartments, departmentsLoaded, departmentsSaving] = usePersistentState<string[]>('departments', Object.values(DefaultDepartments), 'setting');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Now nullable
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  
  const isOnline = useNetworkStatus();
  const isAppReady = usersLoaded && auditsLoaded && incidentsLoaded && sopsLoaded && templatesLoaded && collectionsLoaded && hotelsLoaded && departmentsLoaded;
  const isGlobalSaving = usersSaving || auditsSaving || incidentsSaving || sopsSaving || templatesSaving || collectionsSaving || hotelsSaving || departmentsSaving;

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check Local Session on Mount
  useEffect(() => {
      // Only attempt to load session if users are loaded from DB
      if (!usersLoaded) return;

      const storedUserJson = sessionStorage.getItem('currentUser');
      if (storedUserJson) {
          try {
              const sessionUser: User = JSON.parse(storedUserJson);
              // Verify user still exists in the loaded users list (more robust than just sessionStorage)
              const validUser = users.find(u => u.id === sessionUser.id && u.email === sessionUser.email && u.status === 'active');
              if (validUser) {
                  setCurrentUser(validUser);
                  setIsAuthenticated(true);
              } else {
                  console.warn("Stored session user not found or inactive, logging out.");
                  handleLogout();
              }
          } catch (e) {
              console.error("Failed to parse stored user session:", e);
              handleLogout();
          }
      }
  }, [usersLoaded, users]); // Re-run if users data changes

  // Sync session if currentUser object itself changes (e.g., admin edits current user)
  useEffect(() => {
      if (isAuthenticated && currentUser) {
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
          sessionStorage.removeItem('currentUser');
      }
  }, [currentUser, isAuthenticated]);


  // Security Guard: Redirect non-admins away from Admin Panel
  useEffect(() => {
    // Only apply if authenticated and current user is set
    if (isAuthenticated && currentUser && currentView === 'admin' && currentUser.role !== 'admin') {
      alert("Access Denied: The Admin Panel is restricted to administrators.");
      setCurrentView('dashboard');
    }
  }, [currentView, currentUser, isAuthenticated]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Global Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentModalInitialData, setIncidentModalInitialData] = useState<Partial<NewIncidentData> | null>(null);

  // Admin Actions
  const handleAddHotel = (name: string) => setHotels([...hotels, name]);
  const handleDeleteHotel = (name: string) => setHotels(hotels.filter(h => h !== name));
  
  const handleAddDepartment = (name: string) => setDepartments([...departments, name]);
  const handleDeleteDepartment = (name: string) => setDepartments(departments.filter(d => d !== name));

  // User Actions
  const handleAddUser = (user: User) => setUsers([...users, user]);
  const handleUpdateUser = (updatedUser: User) => setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  const handleDeleteUser = (id: string) => {
      setUsers(users.filter(u => u.id !== id));
      // If the deleted user was the current user, log out
      if (currentUser?.id === id) {
          handleLogout();
      }
  };
  const handleToggleUserStatus = (id: string) => {
      setUsers(users.map(u => {
          if (u.id === id) {
              const newStatus = u.status === 'active' ? 'on-hold' : 'active';
              // If current user is put on-hold, log them out
              if (currentUser?.id === id && newStatus === 'on-hold') {
                  alert("Your account has been put on hold. Logging you out.");
                  handleLogout();
              }
              return { ...u, status: newStatus };
          }
          return u;
      }));
  };

  // SOP Actions
  const handleAddSop = (sop: SOP) => setSops([sop, ...sops]);
  const handleDeleteSop = (id: string) => setSops(sops.filter(s => s.id !== id));

  // Template Actions
  const handleAddTemplate = (template: AuditTemplate) => setTemplates([template, ...templates]);
  const handleDeleteTemplate = (id: string) => setTemplates(templates.filter(t => t.id !== id));

  // Collection Actions
  const handleAddCollection = (collection: Collection) => setCollections([collection, ...collections]);
  const handleDeleteCollection = (id: string) => setCollections(collections.filter(c => c.id !== id));

  // Audit Actions
  const handleSelectAudit = (audit: Audit) => {
    setSelectedAudit(audit);
    setCurrentView('audit');
  };

  const handleUpdateAudit = (updatedAudit: Audit) => {
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    setSelectedAudit(updatedAudit);
  };

  // Silent update for Admin Panel
  const handleSilentUpdateAudit = (updatedAudit: Audit) => {
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    if (selectedAudit && selectedAudit.id === updatedAudit.id) {
        setSelectedAudit(updatedAudit);
    }
  };

  const handleAddAudit = (audit: Audit) => {
      setAudits([audit, ...audits]);
  };

  const handleStartAuditFromTemplate = (template: AuditTemplate) => {
      const newAudit: Audit = {
          id: `audit-${Date.now()}`,
          title: template.title,
          department: template.department,
          status: AuditStatus.Pending,
          dueDate: new Date().toISOString(), // Due immediately
          items: template.items.map((item, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              description: item.description,
              notes: '',
              assignee: item.assignee
          }))
      };
      setAudits([newAudit, ...audits]);
      handleSelectAudit(newAudit);
  };

  // Incident Actions
  const handleReportIncident = (data?: Partial<NewIncidentData>) => {
    setIncidentModalInitialData(data || null);
    setIsIncidentModalOpen(true);
  };

  const handleSaveIncident = (data: NewIncidentData) => {
    const timestamp = new Date().toISOString();
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      ...data,
      status: 'Open' as any, 
      reportedAt: timestamp,
      history: [
          {
              id: `log-${Date.now()}`,
              timestamp: timestamp,
              action: 'Reported',
              user: currentUser?.name || 'Unknown', // Use optional chaining for currentUser
              details: `Initial report created.`
          }
      ]
    };
    setIncidents([newIncident, ...incidents]);
    setIsIncidentModalOpen(false);
    setIncidentModalInitialData(null);
  };

  const handleUpdateIncidentStatus = (incidentId: string, newStatus: IncidentStatus, comment: string) => {
      const timestamp = new Date().toISOString();
      // Use functional update to ensure we have the latest state
      setIncidents((prevIncidents) => prevIncidents.map(inc => {
          if (inc.id === incidentId) {
              const newLog: IncidentActivity = {
                  id: `log-${Date.now()}`,
                  timestamp: timestamp,
                  action: 'Status Update',
                  user: currentUser?.name || 'Unknown', // Use optional chaining
                  details: `Changed status to ${newStatus}. ${comment ? `Note: ${comment}` : ''}`
              };
              return {
                  ...inc,
                  status: newStatus,
                  history: [newLog, ...(inc.history || [])]
              };
          }
          return inc;
      }));
  };

  // Auth Actions
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
      // In a real app, password would be hashed and compared server-side.
      // Here, we simulate by checking the plain text password from our mock/IndexedDB users.
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user && user.password === pass && user.status === 'active') {
          setCurrentUser(user);
          setIsAuthenticated(true);
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('dashboard'); // Redirect to dashboard on logout
  };

  // Dashboard Data Calculation
  const dashboardData = useMemo(() => {
    const pendingAudits = audits.filter(a => a.status === AuditStatus.Pending).length;
    const criticalIncidents = incidents.filter(i => i.priority === 'Critical' && i.status !== 'Resolved' as any).length;
    const dailyHygieneScore = 94; 
    return { pendingAudits, criticalIncidents, dailyHygieneScore };
  }, [audits, incidents]);

  // --- View Routing ---
  const renderView = () => {
    // Current user must be authenticated and set to render any main content
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            data={dashboardData} 
            audits={audits}
            departments={departments} 
            onSelectAudit={handleSelectAudit} 
            onReportIncident={() => handleReportIncident()} 
            darkMode={darkMode}
            currentUser={currentUser}
          />
        );
      case 'auditList':
        return (
          <AuditListView 
            audits={audits}
            onSelectAudit={handleSelectAudit}
            currentUser={currentUser}
          />
        );
      case 'audit':
        return selectedAudit ? (
          <AuditScreen 
            audit={selectedAudit} 
            onSave={handleUpdateAudit} 
            onBack={() => setCurrentView('auditList')} 
            currentUser={currentUser}
            onReportIncident={handleReportIncident}
          />
        ) : (
          <Dashboard 
             data={dashboardData} 
             audits={audits}
             departments={departments}
             onSelectAudit={handleSelectAudit} 
             onReportIncident={() => handleReportIncident()} 
             darkMode={darkMode}
             currentUser={currentUser}
          />
        );
      case 'incidents':
        return <IncidentList 
                incidents={incidents} 
                onReportIncident={() => handleReportIncident()} 
                departments={departments} 
                onUpdateStatus={handleUpdateIncidentStatus}
                currentUser={currentUser}
                />;
      case 'sop':
        return <SopLibrary sops={sops} />;
      case 'collections':
        return <Collections collections={collections} templates={templates} sops={sops} onStartAudit={handleStartAuditFromTemplate} />;
      case 'reports':
        return <ReportsView audits={audits} incidents={incidents} currentUser={currentUser} />;
      case 'admin':
        return currentUser.role === 'admin' ? ( // Admin role check also here
          <AdminPanel 
            audits={audits}
            hotels={hotels} 
            departments={departments}
            sops={sops}
            templates={templates}
            collections={collections}
            users={users}
            onAddHotel={handleAddHotel} 
            onDeleteHotel={handleDeleteHotel}
            onAddDepartment={handleAddDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onAddAudit={handleAddAudit}
            onUpdateAudit={handleSilentUpdateAudit}
            onAddSop={handleAddSop}
            onDeleteSop={handleDeleteSop}
            onAddTemplate={handleAddTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onAddCollection={handleAddCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
          />
        ) : null;
      default:
        return <Dashboard data={dashboardData} audits={audits} departments={departments} onSelectAudit={handleSelectAudit} onReportIncident={() => handleReportIncident()} darkMode={darkMode} currentUser={currentUser} />;
    }
  };

  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'auditList', label: 'Audits', icon: ChecklistIcon },
    { id: 'incidents', label: 'Incidents', icon: WarningIcon },
    { id: 'sop', label: 'SOP Library', icon: BookIcon },
    { id: 'collections', label: 'Collections', icon: CollectionIcon },
    { id: 'reports', label: 'Reports Archive', icon: ReportsIcon },
    // Only show Admin Panel if user is Admin and is authenticated
    ...(isAuthenticated && currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: AdminIcon }] : []),
  ], [isAuthenticated, currentUser]); // Re-calculate navItems if auth status or user role changes


  // LOADING SCREEN
  if (!isAppReady) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Hotel Audit Pro</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading local database...</p>
              </div>
          </div>
      );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated || !currentUser) {
      return (
          <LoginScreen onLogin={handleLogin} />
      );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans text-gray-900 dark:text-gray-100`}>
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <ChecklistIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Hotel Audit Pro</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                {darkMode ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
             </button>
             
             {/* Mobile User Profile & Logout */}
             <div className="relative group">
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 font-bold text-sm border border-cyan-200 dark:border-cyan-700">
                    {currentUser.avatar}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 hidden group-hover:block border border-gray-100 dark:border-gray-700 z-20">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold"
                    >
                        <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                    </button>
                </div>
             </div>
          </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
             <ChecklistIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Hotel Audit Pro</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'auditList' && currentView === 'audit');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg mb-4 transition-colors"
            >
                <span className="flex items-center">
                    {darkMode ? (
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
            </button>

            {/* User Profile & Logout */}
            <div className="relative group">
                <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold mr-3 border border-cyan-200 dark:border-cyan-700">
                        {currentUser.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{currentUser.role} - {currentUser.department || 'General'}</p>
                    </div>
                </div>
                
                {/* Logout Button */}
                <div className="mt-2 space-y-1">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-md flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 relative">
        {/* Status Bar - Responsive Position */}
        <div className={`fixed z-50 flex flex-col gap-2 transition-all duration-300 transform 
            ${isGlobalSaving || !isOnline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            bottom-20 left-4 right-4 md:bottom-auto md:left-auto md:top-4 md:right-4 md:items-end
        `}>
            {!isOnline && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center justify-center md:justify-start text-sm font-bold animate-pulse">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
                    Working Offline
                </div>
            )}
            {isGlobalSaving && (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center justify-center md:justify-start text-sm font-bold">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                </div>
            )}
        </div>

        <div className="max-w-7xl mx-auto">
             {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 pb-safe">
        <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'auditList' && currentView === 'audit');
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`flex flex-col items-center justify-center py-3 px-1 w-full transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                  <span className="text-[10px] font-medium truncate max-w-[60px]">
                      {item.label === 'SOP Library' ? 'SOP' : item.label === 'Admin Panel' ? 'Admin' : item.label === 'Reports Archive' ? 'Reports' : item.label}
                  </span>
                </button>
              );
            })}
        </div>
      </nav>

      <ReportIncidentModal 
        isOpen={isIncidentModalOpen} 
        onClose={() => setIsIncidentModalOpen(false)} 
        onSave={handleSaveIncident} 
        departments={departments}
        initialData={incidentModalInitialData}
      />
    </div>
  );
}
