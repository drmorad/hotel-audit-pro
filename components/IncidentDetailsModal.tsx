
import React, { useState, useEffect } from 'react';
import type { Incident, IncidentActivity, User } from '../types';
import { IncidentStatus, IncidentPriority } from '../types'; // Added IncidentPriority
import { XIcon } from './icons/ActionIcons';
import { generateIncidentPDF } from '../utils/pdfGenerator';
// Added import for MOCK_USERS to populate assignee dropdown.
import { MOCK_USERS } from '../constants';

interface IncidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  // Added based on usage in IncidentList.tsx
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus, comment: string) => void;
  currentUser: User | null; // Added based on usage in IncidentList.tsx
}

// Color maps from IncidentList.tsx for consistency
const priorityColorMap: Record<IncidentPriority, string> = {
    [IncidentPriority.Critical]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    [IncidentPriority.High]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    [IncidentPriority.Medium]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    [IncidentPriority.Low]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
};

const statusColorMap: Record<IncidentStatus, string> = {
    [IncidentStatus.Open]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    [IncidentStatus.InProgress]: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
    [IncidentStatus.Resolved]: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
    [IncidentStatus.Verified]: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200',
};

const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({ isOpen, onClose, incident, onUpdateStatus, currentUser }) => {
  const [newStatus, setNewStatus] = useState<IncidentStatus>(IncidentStatus.Open);
  const [comment, setComment] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  // Update local state when incident changes (e.g., modal opens for a new incident)
  useEffect(() => {
    if (incident) {
      setNewStatus(incident.status);
      setNewAssignee(incident.assignee || '');
      setComment(''); // Clear comment when incident changes
    }
  }, [incident]);

  const handleStatusUpdate = () => {
    if (incident && (newStatus !== incident.status || comment.trim() !== '')) {
      onUpdateStatus(incident.id, newStatus, comment);
      // Note: Updating assignee is not directly part of onUpdateStatus.
      // If assignee needs to be updated and persisted, onUpdateStatus or a new prop in App.tsx needs to handle it.
      // For this fix, we're only addressing the `status` and `comment` for `onUpdateStatus`.
      onClose();
    }
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // This updates the local assignee selection within the modal.
    // To persist this change to the `incidents` state in App.tsx, `onUpdateStatus`
    // would need to be enhanced, or a separate `onUpdateIncident` prop passed.
    setNewAssignee(e.target.value);
  };

  const handleExportPDF = () => {
    if (incident && currentUser) {
      generateIncidentPDF(incident, currentUser);
    }
  };


  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Incident Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XIcon />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{incident.title}</h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${priorityColorMap[incident.priority]}`}>
              {incident.priority}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300">{incident.description}</p>

          {incident.photo && (
            <div className="mt-4">
              <img src={incident.photo} alt="Incident Evidence" className="max-w-full h-48 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-800 dark:text-white">{incident.department}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Reported At</p>
              <p className="font-medium text-gray-800 dark:text-white">{new Date(incident.reportedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Current Status</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[incident.status]}`}>
                {incident.status}
              </span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Assigned To</p>
              <p className="font-medium text-gray-800 dark:text-white">{incident.assignee || 'Unassigned'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-800 dark:text-white mb-2">Update Status</h4>
            <div className="flex gap-2 mb-2">
                <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                    {Object.values(IncidentStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <select
                    value={newAssignee}
                    onChange={handleAssigneeChange}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                    <option value="">Assignee (Optional)</option>
                    {/* Filter for active users to populate assignment dropdowns */}
                    {MOCK_USERS.filter(u => u.status === 'active').map(user => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                </select>
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment for the status update..."
                rows={2}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            ></textarea>
            <button
                onClick={handleStatusUpdate}
                disabled={newStatus === incident.status && comment.trim() === ''} // Disable if no actual change or comment
                className="mt-3 w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                Update Incident
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-800 dark:text-white mb-2">Activity History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {incident.history && incident.history.length > 0 ? (
                incident.history.map((activity, index) => (
                  <div key={activity.id || index} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-800 dark:text-white">{activity.action} by {activity.user}</p>
                    <p className="text-gray-600 dark:text-gray-300">{activity.details}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-right">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No activity recorded.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                  onClick={handleExportPDF}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Export PDF
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;