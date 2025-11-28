
import React, { useState, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AuditScreen from './components/AuditScreen';
import AuditListView from './components/AuditListView';
import IncidentList from './components/IncidentList';
import SopLibrary from './components/SopLibrary';
import AdminPanel from './components/AdminPanel';
import Collections from './components/Collections';
import ReportsView from './components/ReportsView';
import ReportIncidentModal from './components/ReportIncidentModal';
import { mockAudits, mockIncidents, mockSops, mockTemplates, mockCollections, MOCK_USERS } from './constants';
import type { Audit, Incident, View, NewIncidentData, SOP, AuditTemplate, Collection, User, IncidentActivity, IncidentStatus } from './types';
import { DefaultDepartments, AuditStatus } from './types';

import { DashboardIcon, ChecklistIcon, WarningIcon, BookIcon, AdminIcon, CollectionIcon, ReportsIcon } from './components/icons/NavIcons';

// Helper hook for local storage persistence
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  // Use sticky state for persistence across reloads
  const [users, setUsers] = useStickyState<User[]>(MOCK_USERS, 'hap_users');
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default to Admin, no need to persist session strictly
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [audits, setAudits] = useStickyState<Audit[]>(mockAudits, 'hap_audits');
  const [incidents, setIncidents] = useStickyState<Incident[]>(mockIncidents, 'hap_incidents');
  const [sops, setSops] = useStickyState<SOP[]>(mockSops, 'hap_sops');
  const [templates, setTemplates] = useStickyState<AuditTemplate[]>(mockTemplates, 'hap_templates');
  const [collections, setCollections] = useStickyState<Collection[]>(mockCollections, 'hap_collections');
  
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  
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

  // Security Guard: Redirect non-admins away from Admin Panel
  useEffect(() => {
    if (currentView === 'admin' && currentUser.role !== 'admin') {
      alert("Access Denied: The Admin Panel is restricted to administrators.");
      setCurrentView('dashboard');
    }
  }, [currentView, currentUser]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Global Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Admin Management State
  const [hotels, setHotels] = useStickyState<string[]>(['Grand Plaza Hotel', 'Seaside Resort'], 'hap_hotels');
  const [departments, setDepartments] = useStickyState<string[]>(Object.values(DefaultDepartments), 'hap_departments');

  // Admin Actions
  const handleAddHotel = (name: string) => setHotels([...hotels, name]);
  const handleDeleteHotel = (name: string) => setHotels(hotels.filter(h => h !== name));
  
  const handleAddDepartment = (name: string) => setDepartments([...departments, name]);
  const handleDeleteDepartment = (name: string) => setDepartments(departments.filter(d => d !== name));

  // User Actions
  const handleAddUser = (user: User) => setUsers([...users, user]);
  const handleUpdateUser = (updatedUser: User) => setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));
  const handleToggleUserStatus = (id: string) => {
      setUsers(users.map(u => {
          if (u.id === id) {
              return { ...u, status: u.status === 'active' ? 'on-hold' : 'active' };
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
  const handleReportIncident = () => {
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
              user: currentUser.name,
              details: `Initial report created.`
          }
      ]
    };
    setIncidents([newIncident, ...incidents]);
    setIsIncidentModalOpen(false);
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
                  user: currentUser.name,
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

  // Dashboard Data Calculation
  const dashboardData = useMemo(() => {
    const pendingAudits = audits.filter(a => a.status === AuditStatus.Pending).length;
    const criticalIncidents = incidents.filter(i => i.priority === 'Critical' && i.status !== 'Resolved' as any).length;
    // Mock hygiene score calculation logic
    const dailyHygieneScore = 94; 
    return { pendingAudits, criticalIncidents, dailyHygieneScore };
  }, [audits, incidents]);

  // View Routing
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            data={dashboardData} 
            audits={audits} 
            onSelectAudit={handleSelectAudit} 
            onReportIncident={handleReportIncident}
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
          />
        ) : (
          <Dashboard 
             data={dashboardData} 
             audits={audits} 
             onSelectAudit={handleSelectAudit} 
             onReportIncident={handleReportIncident}
             darkMode={darkMode}
             currentUser={currentUser}
          />
        );
      case 'incidents':
        return <IncidentList 
                incidents={incidents} 
                onReportIncident={handleReportIncident} 
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
        return currentUser.role === 'admin' ? (
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
        return <Dashboard data={dashboardData} audits={audits} onSelectAudit={handleSelectAudit} onReportIncident={handleReportIncident} darkMode={darkMode} currentUser={currentUser} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'auditList', label: 'Audits', icon: ChecklistIcon },
    { id: 'incidents', label: 'Incidents', icon: WarningIcon },
    { id: 'sop', label: 'SOP Library', icon: BookIcon },
    { id: 'collections', label: 'Collections', icon: CollectionIcon },
    { id: 'reports', label: 'Reports Archive', icon: ReportsIcon },
    ...(currentUser.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: AdminIcon }] : []),
  ] as const;

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
             
             {/* Mobile User Switcher */}
             <div className="relative group">
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 font-bold text-sm border border-cyan-200 dark:border-cyan-700">
                    {currentUser.avatar}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 hidden group-hover:block border border-gray-100 dark:border-gray-700 z-20">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Switch User</p>
                    </div>
                    {users.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => setCurrentUser(u)}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${currentUser.id === u.id ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                            {u.name} ({u.role})
                        </button>
                    ))}
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

            {/* User Profile / Switcher */}
            <div className="relative">
                <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold mr-3 border border-cyan-200 dark:border-cyan-700">
                        {currentUser.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{currentUser.role} - {currentUser.department || 'General'}</p>
                    </div>
                </div>
                
                {/* Desktop User Switcher Dropdown (Simple implementation) */}
                <div className="mt-2 space-y-1">
                    <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Account</p>
                    {users.filter(u => u.id !== currentUser.id).map(u => (
                        <button
                            key={u.id}
                            onClick={() => setCurrentUser(u)}
                            className="w-full text-left px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Login as {u.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0">
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
      />
    </div>
  );
}
