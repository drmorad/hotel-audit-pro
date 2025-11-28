
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Audit, User } from '../types';
import { AuditStatus, InspectionResult } from '../types';
import { ClockIcon, WarningIcon } from './icons/NavIcons';

interface DashboardData {
  pendingAudits: number;
  criticalIncidents: number;
  dailyHygieneScore: number;
}

interface DashboardProps {
  data: DashboardData;
  audits: Audit[];
  departments: string[];
  onSelectAudit: (audit: Audit) => void;
  onReportIncident: () => void;
  darkMode?: boolean;
  currentUser: User | null; // Changed to User | null
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

const Dashboard: React.FC<DashboardProps> = ({ data, audits, departments, onSelectAudit, onReportIncident, darkMode = false, currentUser }) => {
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Ensure currentUser is not null before accessing its properties
  if (!currentUser) return null;

  // 1. Filter audits based on Role AND Selected Department
  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      // Admin Filter: Can see all, or filter by specific selected department
      if (currentUser.role === 'admin') {
        if (selectedDept !== 'All' && audit.department !== selectedDept) return false;
        return true;
      }
      
      // Staff Filter: See assignments + Department filter (if they want to filter their own view)
      const hasAssignment = audit.items.some(item => item.assignee === currentUser.name);
      const hasUnassigned = audit.items.some(item => !item.assignee);
      const isRelevant = hasAssignment || hasUnassigned;

      if (!isRelevant) return false;
      if (selectedDept !== 'All' && audit.department !== selectedDept) return false;
      
      return true;
    });
  }, [audits, currentUser, selectedDept]);

  // 2. Separate Pending vs Active for distinct UI sections
  const pendingAudits = filteredAudits.filter(a => a.status === AuditStatus.Pending);
  
  // --- Analytics Logic (Memoized) ---
  const analytics = useMemo(() => {
    // Only analyze audits that have results (In Progress or Completed)
    const activeAudits = filteredAudits.filter(a => a.items.some(i => i.result));

    // 1. Department Performance (Always calculate global stats for the Bar Chart context)
    // We iterate over ALL audits (not just filtered) for the Department Comparison Chart to keep it relevant contextually
    const globalActiveAudits = audits.filter(a => a.items.some(i => i.result));
    const deptStats: Record<string, { total: number; passed: number }> = {};
    
    globalActiveAudits.forEach(audit => {
        if (!deptStats[audit.department]) {
            deptStats[audit.department] = { total: 0, passed: 0 };
        }
        audit.items.forEach(item => {
            if (item.result === InspectionResult.Pass || item.result === InspectionResult.Fail) {
                deptStats[audit.department].total++;
                if (item.result === InspectionResult.Pass) deptStats[audit.department].passed++;
            }
        });
    });

    // 2. Item Failures (Scoped to current filter)
    const itemFailures: Record<string, { count: number, department: string }> = {};

    // 3. Heatmap Data: Rows depend on Filter!
    // If All Depts -> Rows = Departments
    // If Specific Dept -> Rows = Specific Inspection Items (Drill down)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapData: Record<string, Record<string, { passed: number, total: number }>> = {};
    
    // 4. Daily Trend Data (Scoped to current filter)
    const dailyStats: Record<string, { passed: number, total: number }> = {};
    days.forEach(d => dailyStats[d] = { passed: 0, total: 0 });

    activeAudits.forEach(audit => {
      const date = new Date(audit.dueDate);
      const dayName = !isNaN(date.getTime()) ? days[date.getDay()] : 'Mon';

      audit.items.forEach(item => {
        // Determine Heatmap Row Key
        // If viewing all, group by Dept. If viewing Dept, group by Item Description to pinpoint failures.
        const rowKey = selectedDept === 'All' ? audit.department : item.description;

        // Heatmap Init (Lazy init inside loop due to rowKey dependency on Item)
        if (!heatmapData[rowKey]) {
            heatmapData[rowKey] = {};
            days.forEach(d => heatmapData[rowKey][d] = { passed: 0, total: 0 });
        }

        // General Stats & Heatmap
        if (item.result === InspectionResult.Pass || item.result === InspectionResult.Fail) {
          
          if (heatmapData[rowKey] && heatmapData[rowKey][dayName]) {
             heatmapData[rowKey][dayName].total++;
          }
          
          if (dailyStats[dayName]) {
              dailyStats[dayName].total++;
          }

          if (item.result === InspectionResult.Pass) {
            if (heatmapData[rowKey] && heatmapData[rowKey][dayName]) {
                heatmapData[rowKey][dayName].passed++;
            }
            if (dailyStats[dayName]) {
                dailyStats[dayName].passed++;
            }
          }
        }
        
        // Failure Tracking
        if (item.result === InspectionResult.Fail) {
          const key = item.description; 
          if (!itemFailures[key]) {
              itemFailures[key] = { count: 0, department: audit.department };
          }
          itemFailures[key].count++;
        }
      });
    });

    const deptScores = Object.entries(deptStats).map(([name, stats]) => ({
      name,
      score: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0
    })).sort((a, b) => b.score - a.score);

    const topFailures = Object.entries(itemFailures)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    const trendData = days.map(day => ({
        name: day,
        score: dailyStats[day].total > 0 ? Math.round((dailyStats[day].passed / dailyStats[day].total) * 100) : 0
    }));

    // Dynamic Overall Score for the Stat Card
    const validDays = trendData.filter(d => d.score > 0);
    const avgScore = validDays.length > 0 
        ? Math.round(validDays.reduce((acc, curr) => acc + curr.score, 0) / validDays.length)
        : (data.dailyHygieneScore || 100); 

    // Sort Heatmap Rows: Problem areas (Lowest Score) first
    const sortedHeatmapRows = Object.entries(heatmapData).sort(([, aData], [, bData]) => {
        const aTotal = days.reduce((acc, d) => acc + (aData[d]?.total || 0), 0);
        const aPassed = days.reduce((acc, d) => acc + (aData[d]?.passed || 0), 0);
        const aScore = aTotal > 0 ? (aPassed / aTotal) : 100;

        const bTotal = days.reduce((acc, d) => acc + (bData[d]?.total || 0), 0);
        const bPassed = days.reduce((acc, d) => acc + (bData[d]?.passed || 0), 0);
        const bScore = bTotal > 0 ? (bPassed / bTotal) : 100;

        return aScore - bScore; // Ascending (Lowest score first)
    });

    return { deptScores, topFailures, sortedHeatmapRows, days, trendData, avgScore };
  }, [filteredAudits, audits, selectedDept, data.dailyHygieneScore]);

  // Heatmap Color Helper
  const getHeatmapColor = (passed: number, total: number) => {
      if (total === 0) return 'bg-gray-100 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600'; 
      const score = (passed / total) * 100;
      if (score === 100) return 'bg-green-500 text-white';
      if (score >= 80) return 'bg-green-400 text-white';
      if (score >= 60) return 'bg-yellow-400 text-white';
      if (score >= 40) return 'bg-orange-400 text-white';
      return 'bg-red-500 text-white';
  };

  // Chart Colors
  const chartTextColor = darkMode ? '#9ca3af' : '#6b7280'; 
  const chartGridColor = darkMode ? '#374151' : '#e5e7eb'; 
  const tooltipBgColor = darkMode ? '#1f2937' : '#ffffff'; 
  const tooltipBorderColor = darkMode ? '#374151' : '#e5e7eb'; 
  const tooltipTextColor = darkMode ? '#f3f4f6' : '#111827'; 
  const barColor = '#2563eb'; 
  const failBarColor = '#ef4444'; 

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                {currentUser?.role === 'admin' ? 'Executive Dashboard' : `Hello, ${currentUser?.name}`}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {currentUser?.role === 'admin' 
                    ? 'Overview of facility operations, compliance trends, and department performance.' 
                    : 'Here are your assigned tasks and performance metrics for today.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {/* Department Filter */}
              <div className="relative w-full sm:w-auto">
                  <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="appearance-none w-full sm:w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm transition-colors"
                  >
                      <option value="All">All Departments</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>

              <button 
                onClick={onReportIncident} 
                className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-4 py-2.5 rounded-lg font-bold hover:bg-orange-200 dark:hover:bg-orange-900/50 flex items-center justify-center transition-colors text-sm border border-orange-200 dark:border-orange-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
              >
                 <WarningIcon className="w-5 h-5 mr-2" /> Report Issue
              </button>
          </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            title={selectedDept === 'All' ? "Overall Compliance" : `${selectedDept} Score`}
            value={`${analytics.avgScore}%`} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
        />
        <StatCard 
            title="Pending Audits" 
            value={pendingAudits.length} 
            icon={<ClockIcon />} 
        />
        <StatCard 
            title="Active Emergencies" 
            value={data.criticalIncidents} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {currentUser?.role === 'admin' && (
            <div className="xl:col-span-2 space-y-8">
                {/* 1. Main Weekly Trends Chart (Dynamic Data) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
                        {selectedDept === 'All' ? 'Weekly Cleanliness Trends' : `${selectedDept} Weekly Trend`}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                        <YAxis unit="%" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                        <Tooltip 
                            cursor={{fill: darkMode ? 'rgba(239, 246, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}} 
                            contentStyle={{ backgroundColor: tooltipBgColor, border: `1px solid ${tooltipBorderColor}`, borderRadius: '0.5rem', color: tooltipTextColor }}
                            itemStyle={{ color: tooltipTextColor }}
                        />
                        <Legend wrapperStyle={{ color: chartTextColor }} />
                        <Bar dataKey="score" fill={barColor} name="Avg Score" barSize={30} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Analytics Section: Department Heatmap & Failures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Compliance Heatmap (Dept vs Day) */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Compliance Heatmap</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pass rate by Day</p>
                            </div>
                            <div className="flex gap-1 text-[10px]">
                                <span className="flex items-center px-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>High</span>
                                <span className="flex items-center px-1"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1"></span>Med</span>
                                <span className="flex items-center px-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>Low</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-[400px]">
                                {/* Header Row */}
                                <div className="grid grid-cols-8 gap-1 mb-1">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider p-1">
                                        {selectedDept === 'All' ? 'Dept' : 'Item'}
                                    </div>
                                    {analytics.days.map(day => (
                                        <div key={day} className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider p-1">{day}</div>
                                    ))}
                                </div>
                                
                                {/* Data Rows (Sorted by Lowest Score) */}
                                {analytics.sortedHeatmapRows.slice(0, 10).map(([rowLabel, daysData]) => {
                                    const total = analytics.days.reduce((acc, day) => acc + (daysData[day]?.total || 0), 0);
                                    const passed = analytics.days.reduce((acc, day) => acc + (daysData[day]?.passed || 0), 0);

                                    return (
                                    <div key={rowLabel} className="grid grid-cols-8 gap-1 mb-1 items-center">
                                        <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300 p-1 truncate" title={rowLabel}>{rowLabel.length > 15 ? rowLabel.substring(0, 15) + '...' : rowLabel}</div>
                                        {analytics.days.map(day => {
                                            const { passed: dayPassed, total: dayTotal } = daysData[day] || { passed: 0, total: 0 };
                                            return (
                                                <div 
                                                    key={day} 
                                                    className={`h-8 rounded flex items-center justify-center text-[10px] font-bold transition-all hover:opacity-90 cursor-default group relative ${getHeatmapColor(dayPassed, dayTotal)}`}
                                                >
                                                    {dayTotal > 0 ? `${Math.round((dayPassed/dayTotal)*100)}%` : '-'}
                                                    
                                                    {/* Tooltip */}
                                                    {dayTotal > 0 && (
                                                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max min-w-[120px] bg-gray-900 text-white text-xs rounded p-2 z-10 shadow-lg text-left pointer-events-none">
                                                            <div className="font-bold mb-1 border-b border-gray-700 pb-1">{rowLabel} ({day})</div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-green-400">Passed:</span>
                                                                <span className="font-bold">{dayPassed}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-red-400">Failed:</span>
                                                                <span className="font-bold">{dayTotal - dayPassed}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-gray-700">
                                                                <span className="text-gray-400">Total:</span>
                                                                <span className="font-bold">{dayTotal}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                {analytics.sortedHeatmapRows.length === 0 && (
                                    <div className="text-center text-gray-400 py-8 text-sm italic">
                                        No data available for {selectedDept === 'All' ? 'any department' : selectedDept}.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Frequent Failures List */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Top Recurring Failures</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Most frequent failed items {selectedDept !== 'All' ? `in ${selectedDept}` : ''}</p>
                        
                        {analytics.topFailures.length > 0 ? (
                            <ul className="space-y-3">
                                {analytics.topFailures.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={item.name}>{item.name}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold">{item.department}</p>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-red-100 dark:border-red-900/50 whitespace-nowrap">
                                            {item.count} Failures
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 dark:text-gray-500">
                                <span className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <p className="text-sm">Great job! No recent failures.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        <div className={`${currentUser?.role === 'admin' ? '' : 'xl:col-span-3'} bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors`}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
             {currentUser?.role === 'admin' ? 'Pending Audits List' : 'My Assigned Audits'}
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pr-2">
            {pendingAudits.length > 0 ? pendingAudits.map(audit => (
              <div key={audit.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{audit.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">{audit.department}</span>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(audit.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                  </div>
                  <button onClick={() => onSelectAudit(audit)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shrink-0 shadow-sm">
                      {currentUser?.role === 'admin' ? 'View' : 'Start'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
                <p className="text-sm">No pending tasks for {selectedDept === 'All' ? 'any department' : selectedDept}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
