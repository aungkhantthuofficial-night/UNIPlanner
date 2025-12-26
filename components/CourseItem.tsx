
import React, { useState } from 'react';
import { Course, CourseStatus } from '../types';
import { DEFAULT_AREAS } from '../constants';

interface CourseItemProps {
  course: Course;
  onDelete: (id: string) => void;
  onEdit: (course: Course) => void;
  onStatusChange: (id: string, status: CourseStatus) => void;
}

export const CourseItem: React.FC<CourseItemProps> = ({ course, onDelete, onEdit, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    [CourseStatus.Passed]: "bg-green-100 text-green-800 border-green-200",
    [CourseStatus.InProgress]: "bg-blue-100 text-blue-800 border-blue-200",
    [CourseStatus.Planned]: "bg-slate-100 text-slate-800 border-slate-200",
    [CourseStatus.Failed]: "bg-red-100 text-red-800 border-red-200",
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Helper to get area name
  const areaName = DEFAULT_AREAS.find(a => a.id === course.area)?.name;

  const formattedExamDate = course.examDate 
    ? new Date(course.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-2 overflow-hidden">
      <div className="flex items-center justify-between p-3 gap-3">
        {/* Left Section: Icon + Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={toggleExpand}>
          <button 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate select-none flex items-center gap-2">
              <span className="truncate">{course.name}</span>
              {!isExpanded && areaName && (
                  <span className="text-xs font-normal text-slate-400 whitespace-nowrap hidden sm:inline-block">
                    • {areaName}
                  </span>
              )}
            </h4>
            {!isExpanded && (
               <div className="text-xs text-slate-500 mt-0.5 truncate select-none flex items-center gap-2">
                 <span>{course.ects} ECTS</span>
                 {course.grade ? <span>• Grade: {course.grade.toFixed(1)}</span> : ''}
                 {formattedExamDate && (
                    <span className="text-blue-500 font-bold ml-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                      {formattedExamDate}
                    </span>
                 )}
               </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <select
              value={course.status}
              onChange={(e) => onStatusChange(course.id, e.target.value as CourseStatus)}
              className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 max-w-[100px] sm:max-w-none ${statusColors[course.status]}`}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.values(CourseStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <div className="flex items-center border-l border-slate-200 pl-2 sm:pl-3 gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(course); }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                aria-label="Edit course"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Delete course"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
        </div>
      </div>

      {isExpanded && (
         <div className="px-10 pb-4 pt-1 bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                   <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">ECTS Credits</span>
                   <span className="text-slate-700 font-medium text-sm">{course.ects}</span>
                </div>
                <div>
                   <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">Semester</span>
                   <span className="text-slate-700 font-medium text-sm">{course.semester}</span>
                </div>
                <div>
                   <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">Exam Session</span>
                   <span className={`font-medium text-sm flex items-center gap-1.5 ${formattedExamDate ? 'text-blue-600' : 'text-slate-400 italic'}`}>
                     {formattedExamDate || 'No date set'}
                   </span>
                </div>
                <div>
                   <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">Grade</span>
                   <span className={`font-medium text-sm ${course.grade ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                     {course.grade ? course.grade.toFixed(1) : '—'}
                   </span>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
