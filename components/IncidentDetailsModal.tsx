
import React, { useState } from 'react';
import type { Incident, IncidentActivity, User } from '../types';
import { IncidentStatus } from '../types';
import { XIcon } from './icons/ActionIcons';
import { generateIncidentPDF } from '../utils/pdfGenerator';

interface IncidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus, comment: string) => void;
  currentUser: User;
}

const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({ 
    isOpen, 
    onClose, 
    incident, 
    onUpdateStatus, 
    currentUser 
}) => {
  const [newStatus, setNewStatus] = useState<IncidentStatus | ''>('');
  const [comment, setComment] = useState('');

  if (!isOpen || !incident) return null;

  const handleUpdate = () => {
      if (newStatus && newStatus !== incident.status) {
          onUpdateStatus(incident.id, newStatus, comment);
          setComment('');
          setNewStatus('');
          // Don't close immediately, let user see the update in the log
      }
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString(undefined, { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
  };

  const handleDownloadPDF = () => {
      generateIncidentPDF(incident, currentUser);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors flex flex-col">
        <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{incident.title}</h2>
              <div className="flex gap-2 mt-2">
                 <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-600">{incident.department}</span>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${incident.priority === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{incident.priority}</span>
              </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XIcon />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    {incident.description}
                </p>
                
                {incident.photo && (
                    <div className="mt-4">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Evidence</h4>
                        <img src={incident.photo} alt="Incident Evidence" className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" />
                    </div>
                )}
            </div>

            <div className="flex flex-col h-full">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Update Status</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                     <div className="mb-3">
                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 uppercase">Current Status: {incident.status}</label>
                        <select 
                            value={newStatus} 
                            onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                            className="w-full p-2 border border-blue-200 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        >
                            <option value="">Change Status To...</option>
                            {Object.values(IncidentStatus).map(s => (
                                <option key={s} value={s} disabled={s === incident.status}>{s}</option>
                            ))}
                        </select>
                     </div>
                     <div className="mb-3">
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add update note..."
                            rows={2}
                            className="w-full p-2 border border-blue-200 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        ></textarea>
                     </div>
                     <button 
                        onClick={handleUpdate}
                        disabled={!newStatus}
                        className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                     >
                         Update & Log
                     </button>
                </div>
            </div>
        </div>

        {/* Activity Log Section */}
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                     <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Activity Log
                 </h3>
                 <button 
                    onClick={handleDownloadPDF}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                 >
                     <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Download Report
                 </button>
             </div>
             <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                 {incident.history && incident.history.length > 0 ? (
                     incident.history.map((log) => (
                         <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-gray-200 dark:border-gray-700 last:border-0">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800"></div>
                             <div className="flex justify-between items-start">
                                 <span className="text-sm font-bold text-gray-800 dark:text-white">{log.action}</span>
                                 <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.timestamp)}</span>
                             </div>
                             <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">by {log.user}</p>
                             {log.details && <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded mt-1">{log.details}</p>}
                         </div>
                     ))
                 ) : (
                     <p className="text-sm text-gray-500 italic">No history available.</p>
                 )}
             </div>
        </div>

      </div>
    </div>
  );
};

export default IncidentDetailsModal;
