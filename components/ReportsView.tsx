
import React, { useState } from 'react';
import type { Audit, Incident, User } from '../types';
import { AuditStatus, IncidentStatus, IncidentPriority } from '../types';
import { generateAuditPDF, generateIncidentPDF } from '../utils/pdfGenerator';

interface ReportsViewProps {
  audits: Audit[];
  incidents: Incident[];
  currentUser: User | null; // Changed to User | null
}

type ReportType = 'audits' | 'incidents';

const ReportsView: React.FC<ReportsViewProps> = ({ audits, incidents, currentUser }) => {
  const [activeTab, setActiveTab] = useState<ReportType>('audits');
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure currentUser is not null for operations that require it
  if (!currentUser) return null; // Or render a loading/error state if expected

  // 1. Filter Audits: Only Completed
  const completedAudits = audits.filter(a => {
      // Basic Filter
      if (a.status !== AuditStatus.Completed) return false;
      
      // Role Filter: Staff only see their own work (either assigned or if they are in the department)
      if (currentUser.role !== 'admin') {
           const hasAssignment = a.items.some(item => item.assignee === currentUser.name);
           // Allow viewing if they completed it or participated, or it belongs to their department
           if (!hasAssignment && a.department !== currentUser.department) return false;
      }

      // Search Filter
      if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
  });

  // 2. Filter Incidents: Resolved or Verified
  const resolvedIncidents = incidents.filter(i => {
      // Allow viewing of all incidents in the archive, but prioritize Resolved/Verified
      // OR maybe we want to see ALL past reports? Usually Archive implies Closed.
      if (i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Verified) return false;
      
      if (currentUser.role !== 'admin') {
          // Staff visibility logic
          if (i.department !== currentUser.department && i.assignee !== currentUser.name) return false;
      }

      if (searchTerm && !i.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reports Archive</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
                View, search, and export historical records and completed inspections.
            </p>
        </div>
        <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
             <input 
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'audits'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
              Audit Reports
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'incidents'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
              Incident Logs
          </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {activeTab === 'audits' && (
             <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
                     <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 uppercase font-semibold text-xs text-gray-500 dark:text-gray-400">
                         <tr>
                             <th className="px-6 py-4">Audit Title</th>
                             <th className="px-6 py-4">Department</th>
                             <th className="px-6 py-4">Completed On</th>
                             <th className="px-6 py-4">Result</th>
                             <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                         {completedAudits.map(audit => {
                             const passed = audit.items.filter(i => i.result === 'Pass').length;
                             const total = audit.items.length;
                             const score = Math.round((passed / total) * 100) || 0;
                             
                             return (
                                <tr key={audit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{audit.title}</td>
                                    <td className="px-6 py-4">{audit.department}</td>
                                    <td className="px-6 py-4">{audit.completedDate || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            score >= 80 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {score}% Score
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => generateAuditPDF(audit, currentUser)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 transition-colors"
                                        >
                                            Download PDF
                                        </button>
                                    </td>
                                </tr>
                             );
                         })}
                         {completedAudits.length === 0 && (
                             <tr>
                                 <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                                     No completed audit reports found matching your criteria.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
             </div>
        )}

        {activeTab === 'incidents' && (
             <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
                     <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 uppercase font-semibold text-xs text-gray-500 dark:text-gray-400">
                         <tr>
                             <th className="px-6 py-4">Incident Title</th>
                             <th className="px-6 py-4">Priority</th>
                             <th className="px-6 py-4">Status</th>
                             <th className="px-6 py-4">Reported On</th>
                             <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                         {resolvedIncidents.map(inc => (
                             <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                 <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                     {inc.title}
                                     <div className="text-xs text-gray-400 font-normal mt-0.5">{inc.department}</div>
                                 </td>
                                 <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                         inc.priority === IncidentPriority.Critical 
                                         ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' 
                                         : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                     }`}>
                                         {inc.priority}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4">
                                     <span className="text-green-600 dark:text-green-400 font-medium flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                                         <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                         {inc.status}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 text-xs">{new Date(inc.reportedAt).toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-right">
                                      <button 
                                          onClick={() => generateIncidentPDF(inc, currentUser)}
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 transition-colors"
                                      >
                                          Download PDF
                                      </button>
                                 </td>
                             </tr>
                         ))}
                         {resolvedIncidents.length === 0 && (
                             <tr>
                                 <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                                     No resolved incident records found matching your criteria.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                </table>
             </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
