
import React, { useState } from 'react';
import type { SOP } from '../types';

interface SopLibraryProps {
  sops: SOP[];
}

const SopLibrary: React.FC<SopLibraryProps> = ({ sops }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sop.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">SOP Library</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Access official standards and procedures for all hotel operations.</p>
        </div>
        <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSops.map((sop) => (
          <div key={sop.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col h-full border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
                <span className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/40 py-1 px-2 rounded-full">{sop.category}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{sop.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow whitespace-pre-wrap line-clamp-4">{sop.content}</p>
            {sop.document && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <a 
                        href={sop.document} 
                        download={sop.documentName || 'document'} 
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download {sop.documentName ? (sop.documentName.length > 20 ? sop.documentName.substring(0,17)+'...' : sop.documentName) : 'Attachment'}
                    </a>
                </div>
            )}
          </div>
        ))}
        
        {filteredSops.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <svg className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No documents found</p>
                <p className="text-sm">Try adjusting your search terms.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SopLibrary;
