
import React, { useState, useMemo } from 'react';
import type { Audit, SOP, AuditTemplate, Collection, User, UserRole } from '../types';
import { AuditStatus, InspectionResult } from '../types';
import { UserIcon, XIcon, PencilIcon } from './icons/ActionIcons';
import { ChecklistIcon } from './icons/NavIcons';
import { STAFF_MEMBERS } from '../constants';

interface AdminPanelProps {
  audits: Audit[];
  hotels: string[];
  departments: string[];
  sops: SOP[];
  templates: AuditTemplate[];
  collections: Collection[];
  users: User[];
  onAddHotel: (name: string) => void;
  onDeleteHotel: (name: string) => void;
  onAddDepartment: (name: string) => void;
  onDeleteDepartment: (name: string) => void;
  onAddAudit: (audit: Audit) => void;
  onUpdateAudit: (audit: Audit) => void;
  onAddSop: (sop: SOP) => void;
  onDeleteSop: (id: string) => void;
  onAddTemplate: (template: AuditTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onAddCollection: (collection: Collection) => void;
  onDeleteCollection: (id: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
}

type Tab = 'progress' | 'hotels' | 'departments' | 'users' | 'tasks' | 'templates' | 'sops' | 'collections';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  audits, 
  hotels, 
  departments,
  sops,
  templates,
  collections,
  users,
  onAddHotel, 
  onDeleteHotel,
  onAddDepartment,
  onDeleteDepartment,
  onAddAudit,
  onUpdateAudit,
  onAddSop,
  onDeleteSop,
  onAddTemplate,
  onDeleteTemplate,
  onAddCollection,
  onDeleteCollection,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const [newHotel, setNewHotel] = useState('');
  const [newDept, setNewDept] = useState('');

  // Task Creation State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDept, setNewTaskDept] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskItems, setNewTaskItems] = useState<{description: string, assignee: string}[]>([{description: '', assignee: ''}]);

  // Template Creation State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDept, setNewTemplateDept] = useState('');
  const [newTemplateItems, setNewTemplateItems] = useState<{description: string, assignee: string}[]>([{description: '', assignee: ''}]);

  // SOP Creation State
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [newSopTitle, setNewSopTitle] = useState('');
  const [newSopCategory, setNewSopCategory] = useState('');
  const [newSopContent, setNewSopContent] = useState('');
  const [newSopFile, setNewSopFile] = useState<{data: string, name: string} | null>(null);

  // Collection Creation State
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [newCollectionTemplates, setNewCollectionTemplates] = useState<string[]>([]);
  const [newCollectionSops, setNewCollectionSops] = useState<string[]>([]);

  // User Creation/Editing State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');
  const [newUserDept, setNewUserDept] = useState('');

  // --- Logic for Team Progress ---
  const teamStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; passed: number; failed: number }> = {};
    
    audits.forEach(audit => {
      audit.items.forEach(item => {
        const name = item.assignee || 'Unassigned';
        if (!stats[name]) {
          stats[name] = { total: 0, completed: 0, passed: 0, failed: 0 };
        }
        stats[name].total += 1;
        if (item.result) {
          stats[name].completed += 1;
        }
        if (item.result === 'Pass') stats[name].passed += 1;
        if (item.result === 'Fail') stats[name].failed += 1;
      });
    });

    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [audits]);

  // --- Handlers ---
  const handleAddHotel = () => {
    if (newHotel.trim() && !hotels.includes(newHotel.trim())) {
      onAddHotel(newHotel.trim());
      setNewHotel('');
    }
  };

  const handleAddDept = () => {
    if (newDept.trim() && !departments.includes(newDept.trim())) {
      onAddDepartment(newDept.trim());
      setNewDept('');
    }
  };

  // Helper for Initials
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '';
  };

  // Task List Handlers
  const addNewItemRow = () => {
    setNewTaskItems([...newTaskItems, {description: '', assignee: ''}]);
  };

  const updateItemRow = (index: number, field: 'description' | 'assignee', value: string) => {
    const updated = [...newTaskItems];
    updated[index][field] = value;
    setNewTaskItems(updated);
  };

  const removeItemRow = (index: number) => {
    setNewTaskItems(newTaskItems.filter((_, i) => i !== index));
  };

  const handleOpenTaskModal = () => {
      setNewTaskDept(departments[0] || '');
      setNewTaskItems([{description: '', assignee: ''}]);
      setNewTaskTitle('');
      setNewTaskDate('');
      setIsTaskModalOpen(true);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const templateId = e.target.value;
      if (!templateId) return;
      
      const template = templates.find(t => t.id === templateId);
      if (template) {
          // Preserve existing title if typed, else use template title
          if(!newTaskTitle.trim()) setNewTaskTitle(template.title);
          setNewTaskDept(template.department);
          // Overwrite items with template items
          setNewTaskItems(template.items.map(i => ({ description: i.description, assignee: i.assignee || '' })));
      }
  };

  const saveNewAudit = () => {
    if (!newTaskTitle.trim() || !newTaskDept || !newTaskDate) return;

    const validItems = newTaskItems.filter(i => i.description.trim() !== '');
    if (validItems.length === 0) return;

    const audit: Audit = {
        id: `audit-${Date.now()}`,
        title: newTaskTitle,
        department: newTaskDept,
        status: AuditStatus.Pending,
        dueDate: newTaskDate,
        items: validItems.map((i, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            description: i.description,
            notes: '',
            assignee: i.assignee || undefined
        }))
    };
    onAddAudit(audit);
    setIsTaskModalOpen(false);
    
    // reset form
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskItems([{description: '', assignee: ''}]);
  };

  const handleToggleItem = (audit: Audit, itemId: string, checked: boolean) => {
      const updatedItems = audit.items.map(item => {
          if (item.id === itemId) {
              return { ...item, result: checked ? InspectionResult.Pass : undefined };
          }
          return item;
      });
      onUpdateAudit({ ...audit, items: updatedItems });
  };

  // Template Handlers
  const handleOpenTemplateModal = () => {
      setNewTemplateDept(departments[0] || '');
      setNewTemplateItems([{description: '', assignee: ''}]);
      setNewTemplateTitle('');
      setIsTemplateModalOpen(true);
  };

  const addTemplateItemRow = () => {
      setNewTemplateItems([...newTemplateItems, {description: '', assignee: ''}]);
  };

  const updateTemplateItemRow = (index: number, field: 'description' | 'assignee', value: string) => {
      const updated = [...newTemplateItems];
      updated[index][field] = value;
      setNewTemplateItems(updated);
  };

  const removeTemplateItemRow = (index: number) => {
      setNewTemplateItems(newTemplateItems.filter((_, i) => i !== index));
  };

  const saveNewTemplate = () => {
      if (!newTemplateTitle.trim() || !newTemplateDept) return;
      
      const validItems = newTemplateItems.filter(i => i.description.trim() !== '');
      if (validItems.length === 0) return;

      const template: AuditTemplate = {
          id: `temp-${Date.now()}`,
          title: newTemplateTitle,
          department: newTemplateDept,
          items: validItems
      };
      
      onAddTemplate(template);
      setIsTemplateModalOpen(false);
  };

  const handleScheduleFromTemplate = (template: AuditTemplate) => {
      setNewTaskTitle(template.title);
      setNewTaskDept(template.department);
      setNewTaskItems(template.items.map(i => ({ description: i.description, assignee: i.assignee || '' })));
      setNewTaskDate('');
      setIsTaskModalOpen(true);
  };

  // SOP Handlers
  const handleOpenSopModal = () => {
    setNewSopCategory(departments[0] || 'All Departments');
    setIsSopModalOpen(true);
  };

  const handleSopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setNewSopFile({
              data: event.target.result,
              name: file.name
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSopFile = () => {
      setNewSopFile(null);
  };

  const saveNewSop = () => {
      if (!newSopTitle.trim() || !newSopContent.trim()) return;

      const sop: SOP = {
          id: `sop-${Date.now()}`,
          title: newSopTitle,
          category: newSopCategory,
          content: newSopContent,
          document: newSopFile?.data,
          documentName: newSopFile?.name
      };

      onAddSop(sop);
      setIsSopModalOpen(false);
      
      setNewSopTitle('');
      setNewSopContent('');
      setNewSopFile(null);
  };

  const handleConvertSopToTemplate = (sop: SOP) => {
    setNewTemplateTitle(sop.title);
    const matchedDept = departments.find(d => d === sop.category) || departments[0] || '';
    setNewTemplateDept(matchedDept);

    const lines = sop.content.split('\n')
        .map(line => line.trim())
        .filter(l => l.length > 0);
    
    let items;
    if (lines.length > 0) {
        items = lines.map(line => {
            const cleaned = line.replace(/^[-*•]\s*/, '');
            return { description: cleaned, assignee: '' };
        });
    } else {
        items = [{ description: `Review procedure: ${sop.title}`, assignee: '' }];
    }
    
    setNewTemplateItems(items);
    setActiveTab('templates');
    setIsTemplateModalOpen(true);
  };

  // Collection Handlers
  const handleOpenCollectionModal = () => {
      setNewCollectionTitle('');
      setNewCollectionDesc('');
      setNewCollectionTemplates([]);
      setNewCollectionSops([]);
      setIsCollectionModalOpen(true);
  };

  const saveNewCollection = () => {
      if(!newCollectionTitle.trim()) return;

      const collection: Collection = {
          id: `col-${Date.now()}`,
          title: newCollectionTitle,
          description: newCollectionDesc,
          templateIds: newCollectionTemplates,
          sopIds: newCollectionSops
      };
      onAddCollection(collection);
      setIsCollectionModalOpen(false);
  };

  const toggleCollectionTemplate = (id: string) => {
      if(newCollectionTemplates.includes(id)) {
          setNewCollectionTemplates(newCollectionTemplates.filter(t => t !== id));
      } else {
          setNewCollectionTemplates([...newCollectionTemplates, id]);
      }
  };

  const toggleCollectionSop = (id: string) => {
      if(newCollectionSops.includes(id)) {
          setNewCollectionSops(newCollectionSops.filter(s => s !== id));
      } else {
          setNewCollectionSops([...newCollectionSops, id]);
      }
  };

  // User Handlers
  const handleOpenAddUserModal = () => {
      setNewUserName('');
      setNewUserRole('staff');
      setNewUserDept(departments[0] || 'Kitchen');
      setEditingUserId(null); // Ensure we are in add mode
      setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: User) => {
      setNewUserName(user.name);
      setNewUserRole(user.role);
      setNewUserDept(user.department || departments[0]);
      setEditingUserId(user.id); // Set ID to allow update logic
      setIsUserModalOpen(true);
  }

  const saveUser = () => {
      if (!newUserName.trim()) return;

      if (editingUserId) {
          // Update existing user
          // Find original to keep stats or other fields if necessary, though for now we just need ID and Status
          const existingUser = users.find(u => u.id === editingUserId);
          if (existingUser) {
              const updatedUser: User = {
                  ...existingUser,
                  name: newUserName,
                  role: newUserRole,
                  department: newUserDept,
                  avatar: getInitials(newUserName),
                  // status is preserved from existingUser spread
              };
              onUpdateUser(updatedUser);
          }
      } else {
          // Create new user
          const user: User = {
              id: `u-${Date.now()}`,
              name: newUserName,
              role: newUserRole,
              department: newUserDept,
              avatar: getInitials(newUserName),
              status: 'active'
          };
          onAddUser(user);
      }
      setIsUserModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="mr-3 bg-gray-800 dark:bg-gray-700 text-white p-2 rounded-lg hidden sm:block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </span>
                Admin Control Panel
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage settings, hotels, departments, and view team performance.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
        {(['progress', 'users', 'hotels', 'departments', 'tasks', 'templates', 'sops', 'collections'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gray-800 dark:bg-gray-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {tab === 'progress' ? 'Team Reports' : tab === 'tasks' ? 'Active Tasks' : tab === 'sops' ? 'Training/SOP' : tab === 'templates' ? 'Templates' : tab}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 min-h-[400px] transition-colors">
        
        {/* TEAM PROGRESS TAB */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Team Performance Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamStats.map((member) => (
                    <div key={member.name} className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-cyan-100 dark:bg-cyan-900/40 p-2 rounded-full">
                                <UserIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.completed} of {member.total} tasks done</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${member.total > 0 ? (member.completed / member.total) * 100 : 0}%` }}></div>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">{member.passed} Passed</span>
                                <span className="text-red-600 dark:text-red-400 font-medium">{member.failed} Failed</span>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
            <div>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">User Management</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage access and roles for your Quality & Hygiene Managers.</p>
                    </div>
                    <button 
                        onClick={handleOpenAddUserModal}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                    >
                        <span className="mr-2 text-lg">+</span> Add Manager/User
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">
                                            {user.avatar}
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-white">{user.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold border ${
                                            user.role === 'admin' 
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{user.department}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold flex items-center gap-1 ${user.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                            {user.status === 'active' ? 'Active' : 'On Hold'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEditUserModal(user)}
                                                className="text-gray-400 hover:text-blue-500 p-1"
                                                title="Edit User Details"
                                            >
                                                <PencilIcon />
                                            </button>
                                            <button 
                                                onClick={() => onToggleUserStatus(user.id)}
                                                className={`text-xs px-3 py-1 rounded border transition-colors ${
                                                    user.status === 'active' 
                                                    ? 'border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                    : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                }`}
                                            >
                                                {user.status === 'active' ? 'Hold' : 'Activate'}
                                            </button>
                                            <button 
                                                onClick={() => onDeleteUser(user.id)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                                title="Delete User"
                                            >
                                                <XIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* MANAGE HOTELS TAB */}
        {activeTab === 'hotels' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Manage Hotel Properties</h3>
            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={newHotel} 
                    onChange={(e) => setNewHotel(e.target.value)}
                    placeholder="Enter new hotel name..." 
                    className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button 
                    onClick={handleAddHotel}
                    disabled={!newHotel.trim()}
                    className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                    Add Hotel
                </button>
            </div>
            
            <ul className="space-y-2">
                {hotels.map((hotel, idx) => (
                    <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{hotel}</span>
                        <button 
                            onClick={() => onDeleteHotel(hotel)}
                            className="text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Hotel"
                        >
                            <XIcon />
                        </button>
                    </li>
                ))}
                {hotels.length === 0 && <p className="text-gray-500 dark:text-gray-400 italic">No hotels added yet.</p>}
            </ul>
          </div>
        )}

        {/* MANAGE DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Manage Departments</h3>
            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={newDept} 
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Enter new department..." 
                    className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button 
                    onClick={handleAddDept}
                    disabled={!newDept.trim()}
                    className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                    Add Dept
                </button>
            </div>
            
            <ul className="space-y-2">
                {departments.map((dept, idx) => (
                    <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{dept}</span>
                        <button 
                            onClick={() => onDeleteDepartment(dept)}
                            className="text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Department"
                        >
                            <XIcon />
                        </button>
                    </li>
                ))}
            </ul>
          </div>
        )}

        {/* TASK OVERVIEW TAB */}
        {activeTab === 'tasks' && (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 gap-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">All Active Tasks (Audits)</h3>
                    <button 
                        onClick={handleOpenTaskModal}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                    >
                        <span className="mr-2 text-lg">+</span> New Task
                    </button>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3 w-1/4">Task Title</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3 w-1/3">Inspection Items</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {audits.map(audit => (
                                <tr key={audit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 valign-top">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white align-top">{audit.title}</td>
                                    <td className="px-4 py-3 align-top">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-600">{audit.department}</span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                            {audit.items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between group">
                                                    <label className="flex items-start gap-2 cursor-pointer flex-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!item.result}
                                                            onChange={(e) => handleToggleItem(audit, item.id, e.target.checked)}
                                                            className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <span className={`text-xs transition-colors ${item.result ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'}`}>
                                                            {item.description}
                                                        </span>
                                                    </label>
                                                    {item.assignee && (
                                                         <span title={`Assigned to ${item.assignee}`} className="ml-2 flex-shrink-0 text-[10px] bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-800">
                                                            {getInitials(item.assignee)}
                                                         </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            audit.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 
                                            audit.status === 'Pending' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                        }`}>
                                            {audit.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-top whitespace-nowrap">
                                        {new Date(audit.dueDate).toLocaleString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden space-y-3">
                   {audits.map(audit => (
                     <div key={audit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-gray-800 dark:text-white text-sm">{audit.title}</h4>
                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                audit.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 
                                audit.status === 'Pending' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            }`}>
                                {audit.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                             <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600 mr-2">{audit.department}</span>
                             <span className="text-gray-400 dark:text-gray-500">
                                Due: {new Date(audit.dueDate).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                })}
                             </span>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Checklist Items</p>
                             <div className="flex flex-col gap-2">
                                {audit.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <label className="flex items-start gap-2 flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={!!item.result}
                                                onChange={(e) => handleToggleItem(audit, item.id, e.target.checked)}
                                                className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className={`text-sm ${item.result ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.description}
                                            </span>
                                        </label>
                                        {item.assignee && (
                                            <span className="ml-2 text-[10px] bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 flex-shrink-0">
                                                {getInitials(item.assignee)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Audit Templates</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Create reusable audit checklists.</p>
                    </div>
                    <button 
                        onClick={handleOpenTemplateModal}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                    >
                        <span className="mr-2 text-lg">+</span> New Template
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800 relative">
                            <div className="flex justify-between items-start mb-2 pr-6">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">{template.title}</h4>
                                    <span className="inline-block mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                        {template.department}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => onDeleteTemplate(template.id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                                title="Delete Template"
                            >
                                <XIcon />
                            </button>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{template.items.length} checklist items defined.</p>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => handleScheduleFromTemplate(template)}
                                    className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold px-4 py-2 rounded-lg text-sm transition-all w-full"
                                >
                                    Schedule Audit
                                </button>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <p>No templates found. Create one to streamline your audits.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* SOP MANAGEMENT TAB */}
        {activeTab === 'sops' && (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 gap-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Training & SOPs</h3>
                    <button 
                        onClick={handleOpenSopModal}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                    >
                        <span className="mr-2 text-lg">+</span> New Module
                    </button>
                </div>
                <ul className="space-y-3">
                    {sops.map(sop => (
                        <li key={sop.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group">
                            <div className="mb-2 sm:mb-0 w-full sm:w-auto">
                                <h4 className="font-bold text-gray-800 dark:text-white">{sop.title}</h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-0.5 rounded">{sop.category}</span>
                                    {sop.document && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg> Attachment included</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleConvertSopToTemplate(sop)}
                                    className="flex-1 sm:flex-none justify-center text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-100 text-sm font-medium flex items-center transition-colors border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg shadow-sm"
                                    title="Create an Audit Template from this SOP"
                                >
                                     <ChecklistIcon className="w-4 h-4" />
                                     <span className="ml-1">To Template</span>
                                </button>
                                <button 
                                    onClick={() => onDeleteSop(sop.id)}
                                    className="flex-1 sm:flex-none justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 text-sm font-medium flex items-center transition-colors border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded shadow-sm"
                                >
                                    <XIcon /> <span className="ml-1">Delete</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === 'collections' && (
            <div>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Collections</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bundle templates and training for specific needs.</p>
                    </div>
                    <button 
                        onClick={handleOpenCollectionModal}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                    >
                        <span className="mr-2 text-lg">+</span> New Collection
                    </button>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {collections.map(col => (
                        <div key={col.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative">
                             <button 
                                onClick={() => onDeleteCollection(col.id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                                title="Delete Collection"
                            >
                                <XIcon />
                            </button>
                            <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{col.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{col.description}</p>
                            
                            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-750 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div>
                                    <span className="font-bold block mb-1">Templates:</span>
                                    {col.templateIds.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {col.templateIds.map(tid => {
                                                const t = templates.find(temp => temp.id === tid);
                                                return t ? <li key={tid}>{t.title}</li> : null;
                                            })}
                                        </ul>
                                    ) : <span className="italic text-gray-400">None</span>}
                                </div>
                                <div>
                                    <span className="font-bold block mb-1">Training Modules:</span>
                                    {col.sopIds.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {col.sopIds.map(sid => {
                                                const s = sops.find(sop => sop.id === sid);
                                                return s ? <li key={sid}>{s.title}</li> : null;
                                            })}
                                        </ul>
                                    ) : <span className="italic text-gray-400">None</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {collections.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10 col-span-full">No collections created.</p>}
                 </div>
            </div>
        )}

      </div>

      {/* Create New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Schedule Audit Task</h2>
                    <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon />
                    </button>
                </div>
                <div className="space-y-4">
                    {/* New Template Selector */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                            Quick Start: Load from Template
                        </label>
                        <select 
                            onChange={handleImportTemplate} 
                            defaultValue="" 
                            className="w-full p-2 border border-blue-200 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>Select a template to populate checklist...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title} ({t.items.length} items)</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task List Title</label>
                            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date & Time</label>
                            <input type="datetime-local" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                        <select value={newTaskDept} onChange={(e) => setNewTaskDept(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">{departments.map(d => <option key={d} value={d}>{d}</option>)}</select>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                         <div className="flex justify-between mb-2">
                             <h4 className="font-bold text-gray-800 dark:text-white">Checklist Items</h4>
                             <button onClick={addNewItemRow} className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">+ Add Item</button>
                         </div>
                         <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                             <span className="col-span-8">Task Description</span>
                             <span className="col-span-3">Assign To</span>
                             <span className="col-span-1"></span>
                         </div>
                         <div className="space-y-2 max-h-60 overflow-y-auto">
                            {newTaskItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={item.description} 
                                        onChange={(e) => updateItemRow(idx, 'description', e.target.value)} 
                                        placeholder="Enter task..." 
                                        className="col-span-8 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                                    />
                                    <select
                                        value={item.assignee}
                                        onChange={(e) => updateItemRow(idx, 'assignee', e.target.value)}
                                        className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                                    >
                                        <option value="">Unassigned</option>
                                        {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <button onClick={() => removeItemRow(idx)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center">
                                        <XIcon />
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={saveNewAudit} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Publish Task</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Audit Template</h2>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon />
                    </button>
                </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Title</label>
                            <input type="text" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                            <select value={newTemplateDept} onChange={(e) => setNewTemplateDept(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">{departments.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                         <div className="flex justify-between mb-2">
                             <h4 className="font-bold text-gray-800 dark:text-white">Template Items</h4>
                             <button onClick={addTemplateItemRow} className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">+ Add Item</button>
                         </div>
                         <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                             <span className="col-span-8">Description</span>
                             <span className="col-span-3">Default Assignee</span>
                             <span className="col-span-1"></span>
                         </div>
                         <div className="space-y-2 max-h-60 overflow-y-auto">
                            {newTemplateItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={item.description} 
                                        onChange={(e) => updateTemplateItemRow(idx, 'description', e.target.value)} 
                                        placeholder="Enter item description..." 
                                        className="col-span-8 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                                    />
                                    <select
                                        value={item.assignee}
                                        onChange={(e) => updateTemplateItemRow(idx, 'assignee', e.target.value)}
                                        className="col-span-3 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                                    >
                                        <option value="">None</option>
                                        {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <button onClick={() => removeTemplateItemRow(idx)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center">
                                        <XIcon />
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={saveNewTemplate} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Save Template</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Create SOP Modal */}
      {isSopModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create New SOP</h2>
                    <button onClick={() => setIsSopModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input type="text" value={newSopTitle} onChange={(e) => setNewSopTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select value={newSopCategory} onChange={(e) => setNewSopCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                            <option value="All Departments">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procedure Content</label>
                        <textarea value={newSopContent} onChange={(e) => setNewSopContent(e.target.value)} rows={6} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Document (PDF/Image)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="space-y-1 text-center">
                                {newSopFile ? (
                                    <div className="flex flex-col items-center">
                                        <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate max-w-xs">{newSopFile.name}</p>
                                        <button onClick={handleRemoveSopFile} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium">Remove File</button>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,image/*" onChange={handleSopFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={saveNewSop} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Save SOP</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Create Collection Modal */}
       {isCollectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Collection</h2>
                    <button onClick={() => setIsCollectionModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon />
                    </button>
                </div>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Collection Title</label>
                        <input type="text" value={newCollectionTitle} onChange={(e) => setNewCollectionTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea value={newCollectionDesc} onChange={(e) => setNewCollectionDesc(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"></textarea>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2">Select Templates</h4>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                            {templates.map(t => (
                                <label key={t.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={newCollectionTemplates.includes(t.id)}
                                        onChange={() => toggleCollectionTemplate(t.id)}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.title}</span>
                                </label>
                            ))}
                            {templates.length === 0 && <p className="text-xs text-gray-400 italic p-1">No templates available.</p>}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2">Select SOPs</h4>
                         <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                            {sops.map(s => (
                                <label key={s.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={newCollectionSops.includes(s.id)}
                                        onChange={() => toggleCollectionSop(s.id)}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.title}</span>
                                </label>
                            ))}
                             {sops.length === 0 && <p className="text-xs text-gray-400 italic p-1">No SOPs available.</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={saveNewCollection} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Save Collection</button>
                    </div>
                </div>
            </div>
        </div>
       )}

      {/* Create User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{editingUserId ? 'Edit User' : 'Add New User'}</h2>
                    <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon />
                    </button>
                </div>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="e.g. John Doe"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                            <option value="staff">Staff (Supervisor)</option>
                            <option value="admin">Admin (Manager)</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                        <select value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                             {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={saveUser} disabled={!newUserName.trim()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed">
                            {editingUserId ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
