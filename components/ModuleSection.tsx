import React, { useMemo } from 'react';
import { Course, CourseStatus, MODULE_C_GROUPS, Area, SortField, SortOrder } from '../types';
import { ProgressBar } from './ProgressBar';

interface ModuleSectionProps {
  area: Area;
  courses: Course[];
  onDeleteCourse: (id: string) => void;
  onEditCourse: (course: Course) => void;
  onStatusChange: (id: string, status: CourseStatus) => void;
  
  // Global View Settings
  sortField: SortField;
  sortOrder: SortOrder;
  filterSemester: number | 'all';
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export const ModuleSection: React.FC<ModuleSectionProps> = ({ 
  area, 
  courses, 
  onDeleteCourse, 
  onEditCourse, 
  onStatusChange,
  sortField,
  sortOrder,
  filterSemester,
  onSortFieldChange,
  onSortOrderChange
}) => {
  
  const stats = useMemo(() => {
    const passed = courses.filter(c => c.status === CourseStatus.Passed);
    const inProgress = courses.filter(c => c.status === CourseStatus.InProgress);
    const passedEcts = passed.reduce((sum, c) => sum + c.ects, 0);
    const pendingEcts = inProgress.reduce((sum, c) => sum + c.ects, 0);
    const distinctGroups = new Set(passed.map(c => c.subGroup).filter(Boolean));
    return { passedEcts, pendingEcts, distinctGroups };
  }, [courses]);

  const processedCourses = useMemo(() => {
    let result = [...courses];
    if (filterSemester !== 'all') {
      result = result.filter(c => c.semester === filterSemester);
    }
    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'semester': comparison = a.semester - b.semester; break;
        case 'ects': comparison = a.ects - b.ects; break;
        case 'grade':
          const gradeA = a.grade ?? 999;
          const gradeB = b.grade ?? 999;
          comparison = gradeA - gradeB;
          break;
      }
      if (comparison === 0) comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [courses, sortField, sortOrder, filterSemester]);

  const totalCurrent = stats.passedEcts + stats.pendingEcts;
  const isComplete = stats.passedEcts >= area.required;

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortFieldChange(field);
      onSortOrderChange('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (isActive ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : '');
  };

  const statusColors = {
    [CourseStatus.Passed]: "bg-green-100/80 text-green-800 border-green-200/60",
    [CourseStatus.InProgress]: "bg-blue-100/80 text-blue-800 border-blue-200/60",
    [CourseStatus.Planned]: "bg-slate-100/80 text-slate-800 border-slate-200/60",
    [CourseStatus.Failed]: "bg-red-100/80 text-red-800 border-red-200/60",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
      <div className={`px-6 py-5 border-b border-slate-100/80 flex justify-between items-center ${isComplete ? 'bg-green-50/30' : ''}`}>
        <div>
          <h3 className="text-[17px] font-extrabold text-slate-800/90 flex items-center gap-2 tracking-tight">
            {area.name}
            {isComplete && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600/80">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
            )}
          </h3>
          <p className="text-[11px] font-medium text-slate-400/80 mt-1 uppercase tracking-widest">{area.description}</p>
        </div>
        <div className="text-right">
            <span className={`text-2xl font-black tabular-nums ${isComplete ? 'text-green-600/90' : 'text-slate-900/90'}`}>
                {stats.passedEcts}
            </span>
            <span className="text-slate-300 font-bold ml-1 text-sm">/ {area.required}</span>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Changed from area.color to wave-progress-fill */}
        <ProgressBar current={totalCurrent} max={area.required} colorClass={isComplete ? "bg-green-500/90" : "wave-progress-fill"} showText={false} />

        {area.behavior === 'groups' && (
            <div className="bg-slate-50/40 p-3 rounded-xl text-[11px] text-slate-500/80 border border-slate-100/60">
                <div className="font-bold mb-2 uppercase tracking-widest text-slate-400/70">Categories Covered: {stats.distinctGroups.size}/3</div>
                <div className="flex gap-1.5 flex-wrap">
                    {MODULE_C_GROUPS.map(g => (
                        <span key={g} className={`px-2.5 py-1 rounded-full border transition-colors ${stats.distinctGroups.has(g) ? 'bg-green-100 text-green-700/80 border-green-200/60' : 'bg-slate-100/60 text-slate-400/80 border-slate-200/60'}`}>
                            {g}
                        </span>
                    ))}
                </div>
            </div>
        )}

        <div className="overflow-x-auto border rounded-xl border-slate-100/80">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400/80 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100/60">
              <tr>
                <th className="px-4 py-4 font-bold cursor-pointer group hover:bg-slate-50 transition-colors" onClick={() => handleHeaderClick('name')}>
                  Course <SortIcon field="name" />
                </th>
                <th className="px-4 py-4 font-bold text-center cursor-pointer group hover:bg-slate-50 transition-colors w-16" onClick={() => handleHeaderClick('semester')}>
                  Sem <SortIcon field="semester" />
                </th>
                <th className="px-4 py-4 font-bold text-center cursor-pointer group hover:bg-slate-50 transition-colors w-16" onClick={() => handleHeaderClick('ects')}>
                  ECTS <SortIcon field="ects" />
                </th>
                <th className="px-4 py-4 font-bold text-center cursor-pointer group hover:bg-slate-50 transition-colors w-16" onClick={() => handleHeaderClick('grade')}>
                  Grade <SortIcon field="grade" />
                </th>
                <th className="px-4 py-4 font-bold w-32">Status</th>
                <th className="px-4 py-4 font-bold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {courses.length === 0 ? (
                 <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400/60 font-medium italic">No modules selected.</td></tr>
              ) : processedCourses.length === 0 ? (
                 <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400/60 font-medium italic">Filter applied: No matches found.</td></tr>
              ) : (
                processedCourses.map((course) => (
                  <tr key={course.id} className="bg-white hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800/90 tracking-tight">{course.name}</div>
                      {course.subGroup && (
                        <div className="text-[9px] text-slate-400/60 uppercase tracking-widest mt-1 font-bold">{course.subGroup}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-500/80 font-medium tabular-nums">{course.semester}</td>
                    <td className="px-4 py-4 text-center text-slate-500/80 font-medium tabular-nums">{course.ects}</td>
                    <td className="px-4 py-4 text-center">
                       <span className={`font-bold tabular-nums ${course.grade ? 'text-slate-900/90' : 'text-slate-200/60'}`}>
                          {course.grade ? course.grade.toFixed(1) : '—'}
                       </span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={course.status}
                        onChange={(e) => onStatusChange(course.id, e.target.value as CourseStatus)}
                        className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1.5 rounded-lg border cursor-pointer focus:ring-0 w-full text-center transition-all ${statusColors[course.status]}`}
                      >
                        {Object.values(CourseStatus).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditCourse(course)} className="p-1.5 text-slate-300 hover:text-indigo-600/80 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /></svg>
                        </button>
                        <button onClick={() => onDeleteCourse(course.id)} className="p-1.5 text-slate-300 hover:text-red-500/80 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                        </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};