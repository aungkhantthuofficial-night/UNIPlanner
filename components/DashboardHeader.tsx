import React, { useState } from 'react';
import { Course, CourseStatus, Area, SortField, SortOrder, UserProfile } from '../types';
import { TOTAL_ECTS_REQUIRED, THESIS_PREREQUISITE_ECTS } from '../constants';
import { getAIAdvice } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';

interface DashboardHeaderProps {
  courses: Course[];
  areas: Area[];
  userProfile: UserProfile;
  isSaving?: boolean;
  onEditProfile: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onManageAreasClick: () => void;
  onClearData: () => void;
  onExitToCover: () => void;
  
  // Sorting & Filtering
  sortField: SortField;
  sortOrder: SortOrder;
  filterSemester: number | 'all';
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onFilterSemesterChange: (sem: number | 'all') => void;
  availableSemesters: number[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  courses, 
  areas, 
  userProfile,
  isSaving,
  onEditProfile,
  onImportClick, 
  onExportClick,
  onManageAreasClick,
  onClearData,
  onExitToCover,
  sortField,
  sortOrder,
  filterSemester,
  onSortFieldChange,
  onSortOrderChange,
  onFilterSemesterChange,
  availableSemesters
}) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passedCourses = courses.filter(c => c.status === CourseStatus.Passed);
  const totalPassedEcts = passedCourses.reduce((sum, c) => sum + c.ects, 0);
  
  const thesisReady = totalPassedEcts >= THESIS_PREREQUISITE_ECTS;
  
  const gradedCourses = passedCourses.filter(c => c.grade !== undefined && c.grade > 0);
  const averageGrade = gradedCourses.length > 0
    ? (gradedCourses.reduce((sum, c) => sum + (c.grade! * c.ects), 0) / gradedCourses.reduce((sum, c) => sum + c.ects, 0)).toFixed(2)
    : 'N/A';

  const handleGetAdvice = async () => {
    setIsLoading(true);
    const result = await getAIAdvice(courses, areas);
    setAdvice(result);
    setIsLoading(false);
  };

  const userInitials = userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-4">
        
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 w-full flex items-start gap-4">
             <div className="flex flex-col items-center gap-2">
               <button 
                  onClick={onEditProfile}
                  className="flex-shrink-0 w-14 h-14 bg-slate-900 text-white/90 rounded-2xl flex items-center justify-center font-bold shadow-lg hover:scale-105 transition-transform overflow-hidden relative group border border-slate-200/50"
               >
                  {userProfile.profilePicture ? (
                    <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                       <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                     </svg>
                  </div>
               </button>
               <button 
                  onClick={onExitToCover}
                  className="text-[10px] font-bold uppercase text-slate-400/80 hover:text-slate-900 transition-colors flex items-center gap-1 group tracking-wide"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5 transition-transform group-hover:-translate-x-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                 </svg>
                 Cover
               </button>
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <h1 className="text-xl font-extrabold text-slate-900/90 tracking-tight truncate">
                             {userProfile.fullName || 'University of Passau Student'}
                           </h1>
                           <div className="flex items-center gap-1.5 ml-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`}></div>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                {isSaving ? 'Saving' : 'Sync'}
                              </span>
                           </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500/80 tracking-wide truncate">
                          {userProfile.program || 'MA Development Studies'}
                        </p>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-2 pr-4">
                       <div className="w-8 h-8 bg-slate-900/90 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/90">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                          </svg>
                       </div>
                       <div>
                          <p className="text-[8px] font-bold text-slate-400/70 uppercase tracking-widest leading-none">Official University</p>
                          <p className="text-[11px] font-bold text-slate-900/80 tracking-tight leading-none mt-1">Passau Portal</p>
                       </div>
                    </div>

                    <div className="text-right hidden sm:block pl-4">
                         <p className="text-[10px] text-slate-400/70 font-bold uppercase tracking-widest">Average</p>
                         <p className="text-xl font-extrabold text-slate-800/90 tabular-nums">{averageGrade}</p>
                    </div>
                </div>
                <ProgressBar 
                    current={totalPassedEcts} 
                    max={TOTAL_ECTS_REQUIRED} 
                    colorClass="wave-progress-fill" 
                    label="Degree Progress"
                />
                <div className="flex gap-4 mt-2 text-[10px] font-semibold uppercase tracking-widest">
                    <span className={`${thesisReady ? 'text-emerald-600/90' : 'text-slate-400/80'}`}>
                        Thesis: {thesisReady ? 'Ready' : `${80 - totalPassedEcts} ECTS required`}
                    </span>
                    <span className="text-slate-200/50">|</span>
                    <span className="text-slate-500/70">
                      ID: {userProfile.matriculationNumber || '—'}
                    </span>
                    <button onClick={onClearData} className="ml-auto text-red-400/60 hover:text-red-600 transition-colors uppercase font-bold tracking-widest">
                      Reset
                    </button>
                </div>
             </div>
          </div>

          <div className="flex-shrink-0 flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <button onClick={onManageAreasClick} className="flex items-center gap-2 bg-white border border-slate-200/70 text-slate-700/80 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all whitespace-nowrap">
                Modules
             </button>
             <button onClick={onExportClick} className="flex items-center gap-2 bg-white border border-slate-200/70 text-slate-700/80 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all whitespace-nowrap">
                Export
             </button>
             <button onClick={onImportClick} className="flex items-center gap-2 bg-white border border-slate-200/70 text-slate-700/80 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all whitespace-nowrap">
                Import
             </button>
             <button 
                onClick={handleGetAdvice}
                disabled={isLoading}
                className="flex items-center gap-2 bg-slate-900/95 text-white/95 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-sm transition-all disabled:opacity-70 whitespace-nowrap"
             >
                {isLoading ? 'Wait...' : 'Advice'}
             </button>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="mt-4 pt-4 border-t border-slate-100/80 flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-slate-400/70 tracking-widest">Filters</span>
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200/60">
                <span className="text-[9px] text-slate-400/60 font-bold px-1 uppercase tracking-tight">Sem</span>
                <select
                    value={filterSemester}
                    onChange={(e) => onFilterSemesterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-slate-700/90 border-none focus:ring-0 p-1 cursor-pointer hover:text-blue-600 rounded outline-none tabular-nums"
                >
                    <option value="all">All</option>
                    {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200/60">
                <span className="text-[9px] text-slate-400/60 font-bold px-1 uppercase tracking-tight">By</span>
                <select 
                    value={sortField}
                    onChange={(e) => onSortFieldChange(e.target.value as SortField)}
                    className="bg-transparent text-xs font-bold text-slate-700/90 border-none focus:ring-0 p-1 cursor-pointer hover:text-blue-600 rounded outline-none"
                >
                    <option value="semester">Semester</option>
                    <option value="name">Name</option>
                    <option value="ects">ECTS</option>
                    <option value="grade">Grade</option>
                </select>
            </div>
            <button 
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500/80 hover:text-blue-600 transition-all text-[10px] font-bold uppercase tracking-wider"
            >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
        </div>

        {advice && (
          <div className="mt-4 p-5 bg-indigo-50/50 border border-indigo-100/40 rounded-2xl text-[13px] text-slate-700/90 leading-relaxed animate-in slide-in-from-top-2">
             <div className="flex justify-between items-start mb-2">
                <span className="font-bold uppercase text-[9px] text-indigo-500/80 tracking-widest">Academic Advisor</span>
                <button onClick={() => setAdvice(null)} className="text-indigo-300/60 hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </button>
             </div>
             {advice}
          </div>
        )}

      </div>
    </div>
  );
};