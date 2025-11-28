
import React, { useState } from 'react';
import type { Collection, AuditTemplate, SOP } from '../types';
import { ChecklistIcon, BookIcon } from './icons/NavIcons';

interface CollectionsProps {
  collections: Collection[];
  templates: AuditTemplate[];
  sops: SOP[];
  onStartAudit: (template: AuditTemplate) => void;
}

const Collections: React.FC<CollectionsProps> = ({ collections, templates, sops, onStartAudit }) => {
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  if (activeCollection) {
    const collectionTemplates = templates.filter(t => activeCollection.templateIds.includes(t.id));
    const collectionSops = sops.filter(s => activeCollection.sopIds.includes(s.id));

    return (
      <div>
        <button onClick={() => setActiveCollection(null)} className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center font-medium">
           <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Collections
        </button>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{activeCollection.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{activeCollection.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <ChecklistIcon className="w-6 h-6 mr-2 text-cyan-600 dark:text-cyan-400"/> Inspection Templates
            </h3>
            <div className="space-y-4">
                {collectionTemplates.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white">{t.title}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t.items.length} items</span>
                        </div>
                        <button 
                            onClick={() => onStartAudit(t)}
                            className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-cyan-200 dark:hover:bg-cyan-900/60"
                        >
                            Start
                        </button>
                    </div>
                ))}
                {collectionTemplates.length === 0 && <p className="text-gray-400 italic">No templates in this collection.</p>}
            </div>
          </div>

          <div>
             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <BookIcon className="w-6 h-6 mr-2 text-cyan-600 dark:text-cyan-400"/> Training Modules
            </h3>
             <div className="space-y-4">
                {collectionSops.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-800 dark:text-white">{s.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{s.content}</p>
                        {s.document && <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 block">View Attachment</span>}
                    </div>
                ))}
                 {collectionSops.length === 0 && <p className="text-gray-400 italic">No training modules in this collection.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Collections</h2>
            <p className="text-gray-600 dark:text-gray-400">Bundled checklists and training for specific operational needs.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(col => (
            <div 
                key={col.id} 
                onClick={() => setActiveCollection(col)}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 group"
            >
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors text-cyan-600 dark:text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{col.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{col.description}</p>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                    <span className="flex items-center"><ChecklistIcon className="w-3 h-3 mr-1"/> {col.templateIds.length} Templates</span>
                    <span className="flex items-center"><BookIcon className="w-3 h-3 mr-1"/> {col.sopIds.length} SOPs</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Collections;
