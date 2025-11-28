import React, { useState, useMemo } from 'react';
import type { Audit, InspectionItem, User } from '../types';
import { InspectionResult } from '../types';
import { CameraIcon, CheckIcon, XIcon, BanIcon, UserIcon } from './icons/ActionIcons';
import { STAFF_MEMBERS } from '../constants';
import { generateAuditPDF } from '../utils/pdfGenerator';

interface AuditScreenProps {
  audit: Audit;
  onSave: (updatedAudit: Audit) => void;
  onBack: () => void;
  currentUser: User;
}

const AuditScreen: React.FC<AuditScreenProps> = ({ audit, onSave, onBack, currentUser }) => {
  const [currentAudit, setCurrentAudit] = useState<Audit>({
      ...audit,
      items: audit.items.map(item => ({...item})) // Deep copy items
  });

  const handleItemChange = <K extends keyof InspectionItem>(
    itemId: string,
    field: K,
    value: InspectionItem[K]
  ) => {
    setCurrentAudit(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          handleItemChange(itemId, 'photo', event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    onSave({
        ...currentAudit,
        status: 'Completed',
        completedDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleExportPDF = () => {
    generateAuditPDF(currentAudit, currentUser);
  };

  // Calculate progress based on items that have a result (not undefined)
  const progress = (currentAudit.items.filter(i => i.result).length / currentAudit.items.length) * 100;

  // Calculate team progress statistics
  const assigneeStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {};
    
    // Initialize for 'Unassigned' and any existing assignees
    stats['Unassigned'] = { total: 0, completed: 0 };

    currentAudit.items.forEach(item => {
      const name = item.assignee || 'Unassigned';
      if (!stats[name]) stats[name] = { total: 0, completed: 0 };
      
      stats[name].total++;
      if (item.result) stats[name].completed++;
    });

    return stats;
  }, [currentAudit.items]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-lg mb-20 md:mb-0 border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
        </button>
        <button 
            onClick={handleExportPDF}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg"
            title="Download PDF Report"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export Report
        </button>
      </div>
      
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{audit.title}</h2>
            <p className="text-md text-gray-500 dark:text-gray-400">{audit.department}</p>
        </div>
        <div className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-100 dark:border-orange-900/50 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 dark:text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide">Due Date</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {new Date(audit.dueDate).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
            </div>
        </div>
      </div>

       <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Progress</span>
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Team Progress Tracking */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Team Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(assigneeStats).map(([name, stat]: [string, { total: number; completed: number }]) => (
            stat.total > 0 && (
              <div key={name} className="bg-gray-50 dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                     <div className="bg-cyan-100 dark:bg-cyan-900/40 p-1 rounded-full">
                        <UserIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[100px]" title={name}>{name}</span>
                        {/* Tooltip logic usually handled by title attribute for simple implementation */}
                     </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{stat.completed}/{stat.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${stat.completed === stat.total ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(stat.completed / stat.total) * 100}%` }}></div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {currentAudit.items.map((item, index) => (
          <div key={item.id} className="p-4 sm:p-5 border border-gray-200 dark:border-gray-700 rounded-xl transition-shadow hover:shadow-md bg-white dark:bg-gray-800">
            <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-4">
                <div className="flex-1">
                     <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{index + 1}. {item.description}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Allow assigning self if unassigned */}
                    {!item.assignee && (
                        <button
                            onClick={() => handleItemChange(item.id, 'assignee', currentUser.name)}
                            className="bg-blue-600 dark:bg-blue-600/90 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center whitespace-nowrap ring-offset-1 focus:ring-2 ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            Inspect this item
                        </button>
                    )}

                    {/* Assignee Dropdown */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-700 pl-2 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-colors md:min-w-[180px] w-full md:w-auto">
                        <div title={item.assignee || 'Unassigned'} className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs font-bold shrink-0 ${item.assignee ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                            {item.assignee ? getInitials(item.assignee) : <UserIcon className="w-3 h-3" />}
                        </div>
                        <select
                            value={item.assignee || ''}
                            onChange={(e) => handleItemChange(item.id, 'assignee', e.target.value || undefined)}
                            className="bg-transparent text-sm text-gray-700 dark:text-gray-200 font-medium focus:outline-none cursor-pointer w-full"
                            aria-label="Assign team member"
                        >
                            <option value="">Unassigned</option>
                            {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <button onClick={() => handleItemChange(item.id, 'result', InspectionResult.Pass)} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${item.result === InspectionResult.Pass ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300'}`}><CheckIcon/> <span className="ml-2 font-medium">Pass</span></button>
                <button onClick={() => handleItemChange(item.id, 'result', InspectionResult.Fail)} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${item.result === InspectionResult.Fail ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300'}`}><XIcon/> <span className="ml-2 font-medium">Fail</span></button>
                <button onClick={() => handleItemChange(item.id, 'result', InspectionResult.NA)} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${item.result === InspectionResult.NA ? 'bg-gray-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}><BanIcon/> <span className="ml-2 font-medium">N/A</span></button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-medium">TEMP</span>
                    <input
                    id={`temp-${item.id}`}
                    type="number"
                    placeholder="°F"
                    value={item.temperature ?? ''}
                    onChange={(e) => handleItemChange(item.id, 'temperature', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                 <label htmlFor={`photo-${item.id}`} className={`cursor-pointer p-2.5 rounded-lg transition-colors flex items-center justify-center border ${item.photo ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400' : 'bg-gray-100 dark:bg-gray-700 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                    <CameraIcon />
                    <input id={`photo-${item.id}`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, item.id)} />
                </label>
              </div>
            </div>

            {item.photo && (
              <div className="mt-4 relative inline-block group">
                <img src={item.photo} alt="Evidence" className="h-32 w-auto rounded-lg shadow-sm object-cover border border-gray-200 dark:border-gray-600" />
                <button 
                    onClick={() => handleItemChange(item.id, 'photo', null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <XIcon />
                </button>
              </div>
            )}
            
            <textarea
                value={item.notes}
                onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                placeholder="Add notes or observations..."
                className="w-full mt-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                rows={2}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end md:border-t md:border-gray-200 md:dark:border-gray-700 md:pt-6">
        {/* Desktop Action Button */}
        <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% Completed
            </span>
            <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={progress < 100}
            >
            Complete Audit
            </button>
        </div>
      </div>

      {/* Mobile Sticky Footer Action Button */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex items-center justify-between gap-3">
         <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
             {Math.round(progress)}% Done
         </span>
         <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
            disabled={progress < 100}
         >
            Complete Audit
         </button>
      </div>
    </div>
  );
};

export default AuditScreen;