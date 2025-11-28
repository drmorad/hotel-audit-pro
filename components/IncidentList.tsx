
import React, { useState, useMemo } from 'react';
import type { Incident } from '../types';
import { IncidentPriority, IncidentStatus, IncidentType } from '../types';
import { STAFF_MEMBERS } from '../constants';
import { CameraIcon } from './icons/ActionIcons';

interface IncidentListProps {
  incidents: Incident[];
  onReportIncident: () => void;
  departments: string[];
}

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

const priorityOrder: Record<IncidentPriority, number> = {
    [IncidentPriority.Critical]: 4,
    [IncidentPriority.High]: 3,
    [IncidentPriority.Medium]: 2,
    [IncidentPriority.Low]: 1,
};


const IncidentList: React.FC<IncidentListProps> = ({ incidents, onReportIncident, departments }) => {
  const [activeTab, setActiveTab] = useState<IncidentType>(IncidentType.Emergency);
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterAssignee, setFilterAssignee] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const filteredAndSortedIncidents = useMemo(() => {
    // 1. Filter by Tab (Emergency vs Log)
    let processedIncidents = incidents.filter(i => {
         // Backwards compatibility for mocks that might not have type yet
         const type = i.type || IncidentType.Emergency; 
         return type === activeTab;
    });

    // 2. Filter by dropdowns
    if (filterDepartment !== 'All') {
      processedIncidents = processedIncidents.filter(
        (incident) => incident.department === filterDepartment
      );
    }
    if (filterStatus !== 'All') {
      processedIncidents = processedIncidents.filter(
        (incident) => incident.status === filterStatus
      );
    }
    if (filterAssignee !== 'All') {
      processedIncidents = processedIncidents.filter(
        (incident) => incident.assignee === filterAssignee
      );
    }

    // 3. Sorting
    switch (sortBy) {
      case 'priority-desc':
        processedIncidents.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'priority-asc':
        processedIncidents.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'date-asc':
        processedIncidents.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
        break;
      case 'date-desc':
      default:
        processedIncidents.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
        break;
    }

    return processedIncidents;
  }, [incidents, activeTab, filterDepartment, filterStatus, filterAssignee, sortBy]);

  const clearFilters = () => {
    setFilterDepartment('All');
    setFilterStatus('All');
    setFilterAssignee('All');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Issues & Reports</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage urgent incidents and daily operational logs.</p>
        </div>
        <button
          onClick={onReportIncident}
          className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Report Issue
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
        <button
            onClick={() => setActiveTab(IncidentType.Emergency)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                activeTab === IncidentType.Emergency
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Emergencies
        </button>
        <button
            onClick={() => setActiveTab(IncidentType.DailyLog)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                activeTab === IncidentType.DailyLog
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Daily Logs
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
         <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold flex items-center text-sm uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter & Sort
            </h3>
            {(filterDepartment !== 'All' || filterStatus !== 'All' || filterAssignee !== 'All') && (
                <button onClick={clearFilters} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors">
                    CLEAR
                </button>
            )}
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex-1">
                <label htmlFor="filterDepartment" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Department</label>
                <select id="filterDepartment" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow">
                    <option value="All">All Departments</option>
                    {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Status</label>
                <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow">
                    <option value="All">All Statuses</option>
                    {Object.values(IncidentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
             <div className="flex-1">
                 <label htmlFor="filterAssignee" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Assignee</label>
                 <select id="filterAssignee" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow">
                     <option value="All">All Assignees</option>
                     {STAFF_MEMBERS.map(member => <option key={member} value={member}>{member}</option>)}
                 </select>
             </div>
            <div className="flex-1">
                <label htmlFor="sortBy" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Sort by</label>
                <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow">
                    <option value="date-desc">Date Reported (Newest)</option>
                    <option value="date-asc">Date Reported (Oldest)</option>
                    <option value="priority-desc">Priority (Highest)</option>
                    <option value="priority-asc">Priority (Lowest)</option>
                </select>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        {incident.title}
                        {activeTab === IncidentType.Emergency && incident.priority === IncidentPriority.Critical && (
                            <span className="ml-2 flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                        {incident.photo && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={incident.description}>{incident.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border ${priorityColorMap[incident.priority]}`}>
                      {incident.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${statusColorMap[incident.status]}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{incident.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{incident.assignee || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredAndSortedIncidents.map((incident) => (
            <div key={incident.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex-1 mr-2">
                     <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 flex items-center gap-1">
                        {incident.title}
                        {incident.photo && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                     </h4>
                 </div>
                 <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border shrink-0 ${priorityColorMap[incident.priority]}`}>
                      {incident.priority}
                 </span>
               </div>
               {incident.photo && (
                    <div className="mb-3">
                        <img src={incident.photo} alt="Evidence" className="w-full h-32 object-cover rounded-lg border border-gray-100 dark:border-gray-700" />
                    </div>
               )}
               <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{incident.description}</p>
               <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-xs">
                  <span className="font-medium text-gray-500 dark:text-gray-400">{incident.department}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${statusColorMap[incident.status]}`}>
                      {incident.status}
                  </span>
               </div>
               {incident.assignee && (
                 <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {incident.assignee}
                 </div>
               )}
            </div>
          ))}
        </div>

        {filteredAndSortedIncidents.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-lg">No reports match</p>
              <p className="text-sm mb-4">Try adjusting your filters.</p>
              <button onClick={clearFilters} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm hover:underline">
                Clear all filters
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default IncidentList;
