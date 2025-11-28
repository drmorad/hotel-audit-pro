
import React, { useState, useEffect } from 'react';
import type { NewIncidentData } from '../types';
import { DefaultDepartments, IncidentPriority, IncidentType } from '../types';
import { CameraIcon, XIcon } from './icons/ActionIcons';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incident: NewIncidentData) => void;
  departments: string[];
  initialData?: Partial<NewIncidentData> | null;
}

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ isOpen, onClose, onSave, departments, initialData }) => {
  // Fallback to DefaultDepartments if dynamic list is empty for some reason, though parent should handle
  const initialDept = departments.length > 0 ? departments[0] : DefaultDepartments.Maintenance;

  const [reportType, setReportType] = useState<IncidentType>(IncidentType.Emergency);

  const initialFormState: NewIncidentData = {
    title: '',
    description: '',
    department: initialDept,
    assignee: '',
    priority: IncidentPriority.High,
    type: IncidentType.Emergency,
    photo: null
  };
  
  const [formData, setFormData] = useState<NewIncidentData>(initialFormState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset or Populate form when modal is opened
    if (isOpen) {
      if (initialData) {
          setFormData({
              ...initialFormState,
              ...initialData,
              // Ensure priority/type logic is respected if passed, otherwise default
              type: initialData.type || IncidentType.Emergency,
              priority: initialData.priority || IncidentPriority.High
          });
          setReportType(initialData.type || IncidentType.Emergency);
      } else {
          setFormData(initialFormState);
          setReportType(IncidentType.Emergency);
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  // Update priority default when type changes, but only if user interacts (to avoid overwriting initialData on mount)
  const handleTypeChange = (newType: IncidentType) => {
      setReportType(newType);
      setFormData(prev => ({
        ...prev,
        type: newType,
        priority: newType === IncidentType.Emergency ? IncidentPriority.High : IncidentPriority.Medium
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && value.trim()) {
        setError(null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setFormData(prev => ({ ...prev, photo: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removePhoto = () => {
      setFormData(prev => ({ ...prev, photo: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Please provide a title.');
        return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  const isEmergency = reportType === IncidentType.Emergency;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">New Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XIcon />
          </button>
        </div>

        {/* Type Selector Toggle */}
        <div className="flex gap-4 mb-6">
            <button 
                type="button"
                onClick={() => handleTypeChange(IncidentType.Emergency)}
                className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    isEmergency 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-200 text-gray-500 dark:text-gray-400'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="font-bold text-sm">Emergency Incident</span>
            </button>
            <button 
                 type="button"
                 onClick={() => handleTypeChange(IncidentType.DailyLog)}
                 className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    !isEmergency 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 text-gray-500 dark:text-gray-400'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="font-bold text-sm">Daily Log / Obs</span>
            </button>
        </div>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input 
                type="text" 
                name="title" 
                id="title" 
                value={formData.title} 
                onChange={handleChange} 
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder={isEmergency ? "e.g. Fire alarm in kitchen" : "e.g. Maintenance required in Room 204"}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Provide details..."></textarea>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo Evidence</label>
             <div className="mt-1 flex items-start gap-4">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <CameraIcon />
                    <span className="ml-2">Add Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
                {formData.photo && (
                    <div className="relative group">
                        <img src={formData.photo} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm" />
                        <button 
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            title="Remove photo"
                        >
                            <XIcon /> 
                        </button>
                    </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select name="department" id="department" value={formData.department} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select name="priority" id="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                {Object.values(IncidentPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
            <input type="text" name="assignee" id="assignee" value={formData.assignee} onChange={handleChange} placeholder="e.g. John Doe" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
            <button type="button" onClick={onClose} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            <button 
                type="submit" 
                className={`text-white font-bold py-2.5 px-5 rounded-lg transition-colors shadow-sm ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isEmergency ? 'Report Emergency' : 'Log Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
