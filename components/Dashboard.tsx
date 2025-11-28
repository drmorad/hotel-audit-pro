
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Audit, ChartDataPoint, User } from '../types';
import { mockChartData } from '../constants';
import { AuditStatus } from '../types';
import { ChecklistIcon, ClockIcon, WarningIcon } from './icons/NavIcons';

interface DashboardData {
  pendingAudits: number;
  criticalIncidents: number;
  dailyHygieneScore: number;
}

interface DashboardProps {
  data: DashboardData;
  audits: Audit[];
  onSelectAudit: (audit: Audit) => void;
  onReportIncident: () => void;
  darkMode?: boolean;
  currentUser: User;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4 border border-gray-100 dark:border-gray-700 transition-colors">
    <div className="bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 rounded-full p-3">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data, audits, onSelectAudit, onReportIncident, darkMode = false, currentUser }) => {
  
  // Filter audits: Admin sees all pending; Staff sees only audits containing items assigned to them
  const relevantAudits = audits.filter(audit => {
    if (audit.status !== AuditStatus.Pending) return false;
    
    if (currentUser.role === 'admin') return true;
    
    // For staff, check if they have assignments
    const hasAssignment = audit.items.some(item => item.assignee === currentUser.name);
    // OR if there are unassigned items in their department (optional logic, sticking to direct assignment or unassigned for now)
    const hasUnassigned = audit.items.some(item => !item.assignee);
    
    return hasAssignment || hasUnassigned;
  });

  // Chart Colors
  const chartTextColor = darkMode ? '#9ca3af' : '#6b7280'; // gray-400 vs gray-500
  const chartGridColor = darkMode ? '#374151' : '#e5e7eb'; // gray-700 vs gray-200
  const tooltipBgColor = darkMode ? '#1f2937' : '#ffffff'; // gray-800 vs white
  const tooltipBorderColor = darkMode ? '#374151' : '#e5e7eb'; // gray-700 vs gray-200
  const tooltipTextColor = darkMode ? '#f3f4f6' : '#111827'; // gray-100 vs gray-900

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                {currentUser.role === 'admin' ? 'Executive Dashboard' : `Hello, ${currentUser.name}`}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {currentUser.role === 'admin' ? 'Overview of facility operations and compliance.' : 'Here are your assigned tasks for today.'}
            </p>
          </div>
          <button 
            onClick={onReportIncident} 
            className="w-full sm:w-auto bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-4 py-2.5 rounded-lg font-bold hover:bg-orange-200 dark:hover:bg-orange-900/50 flex items-center justify-center transition-colors text-sm border border-orange-200 dark:border-orange-800 shadow-sm"
          >
             <WarningIcon className="w-5 h-5 mr-2" /> Report Issue / Log
          </button>
      </div>
      
      {/* Stats only fully visible to Admin, Staff gets summarized view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentUser.role === 'admin' ? (
            <>
                <StatCard title="Daily Hygiene Score" value={`${data.dailyHygieneScore}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Total Pending Audits" value={data.pendingAudits} icon={<ClockIcon />} />
                <StatCard title="Active Emergencies" value={data.criticalIncidents} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
            </>
        ) : (
             <>
                <StatCard title="My Pending Tasks" value={relevantAudits.length} icon={<ClockIcon />} />
                <StatCard title="Incidents Reported" value={1} icon={<WarningIcon />} /> {/* Mocked for staff view */}
             </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {currentUser.role === 'admin' && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Weekly Cleanliness Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <YAxis unit="%" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <Tooltip 
                    cursor={{fill: darkMode ? 'rgba(239, 246, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}} 
                    contentStyle={{ backgroundColor: tooltipBgColor, border: `1px solid ${tooltipBorderColor}`, borderRadius: '0.5rem', color: tooltipTextColor }}
                    itemStyle={{ color: tooltipTextColor }}
                />
                <Legend wrapperStyle={{ color: chartTextColor }} />
                <Bar dataKey="score" fill="#2563eb" name="Hygiene Score" barSize={30} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        )}
        
        <div className={`${currentUser.role === 'admin' ? '' : 'lg:col-span-3'} bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors`}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
             {currentUser.role === 'admin' ? 'All Pending Audits' : 'My Assigned Audits'}
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {relevantAudits.length > 0 ? relevantAudits.map(audit => (
              <div key={audit.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{audit.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{audit.department}</span>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due: {new Date(audit.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                  </div>
                  <button onClick={() => onSelectAudit(audit)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-700 shrink-0">
                      {currentUser.role === 'admin' ? 'View' : 'Start'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-8">
                <ChecklistIcon className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600"/>
                <p>No pending tasks found.</p>
                <p>{currentUser.role === 'admin' ? 'The system is all clear!' : 'You are all caught up!'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
