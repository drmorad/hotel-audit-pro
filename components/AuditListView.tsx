import React, { useState } from 'react';
import type { Audit, User } from '../types';
import { AuditStatus } from '../types';
import { ChecklistIcon, ClockIcon } from './icons/NavIcons';
import { generateAuditPDF } from '../utils/pdfGenerator';

interface AuditListViewProps {
  audits: Audit[];
  onSelectAudit: (audit: Audit) => void;
  currentUser: User;
}

const AuditListView: React.FC<AuditListViewProps> = ({ audits, onSelectAudit, currentUser }) => {
  const [filterStatus, setFilterStatus] = useState<'All' | AuditStatus>('All');

  // Filter logic similar to Dashboard but applied to this specific view
  const relevantAudits = audits.filter(audit => {
    // 1. Role Filter
    if (currentUser.role !== 'admin') {
         const hasAssignment = audit.items.some(item => item.assignee === currentUser.name);
         const hasUnassigned = audit.items.some(item => !item.assignee);
         if (!hasAssignment && !hasUnassigned) return false;
    }

    // 2. Status Filter
    if (filterStatus !== 'All' && audit.status !== filterStatus) return false;

    return true;
  });

  const getStatusColor = (status: AuditStatus) => {
      switch (status) {
          case AuditStatus.Completed: return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
          case AuditStatus.InProgress: return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
          default: return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
      }
  };

  const handleExport = (e: React.MouseEvent, audit: Audit) => {
      e.stopPropagation(); // Prevent opening the audit
      generateAuditPDF(audit, currentUser);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Audits & Inspections</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentUser.role === 'admin' ? 'Manage and review all facility audits.' : 'Your assigned inspections and checklists.'}
            </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(['All', AuditStatus.Pending, AuditStatus.InProgress, AuditStatus.Completed] as const).map((status) => (
            <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                {status === 'All' ? 'All Audits' : status}
            </button>
        ))}
      </div>

      {/* Audit List */}
      <div className="grid grid-cols-1 gap-4">
          {relevantAudits.length > 0 ? relevantAudits.map(audit => (
              <div key={audit.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-2">
                             <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(audit.status)}`}>
                                 {audit.status}
                             </span>
                             <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                 {audit.department}
                             </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{audit.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mt-2">
                              <span className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                  Due: {new Date(audit.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                              </span>
                              <span className="flex items-center">
                                  <ChecklistIcon className="w-4 h-4 mr-1 text-gray-400" />
                                  {audit.items.length} Items
                              </span>
                          </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <button 
                            onClick={() => onSelectAudit(audit)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${
                                audit.status === AuditStatus.Completed 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {audit.status === AuditStatus.Completed ? 'Review' : 'Start Audit'}
                        </button>
                        {audit.status === AuditStatus.Completed && (
                             <button 
                                onClick={(e) => handleExport(e, audit)}
                                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export PDF
                            </button>
                        )}
                      </div>
                  </div>
                  {/* Progress Bar for In Progress */}
                  {audit.status !== AuditStatus.Pending && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">
                              <span>Progress</span>
                              <span>{Math.round((audit.items.filter(i => i.result).length / audit.items.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${audit.status === AuditStatus.Completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${(audit.items.filter(i => i.result).length / audit.items.length) * 100}%` }}
                              ></div>
                          </div>
                      </div>
                  )}
              </div>
          )) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <ChecklistIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No audits found</h3>
                  <p className="text-gray-500 dark:text-gray-400">There are no {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} audits matching your criteria.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default AuditListView;