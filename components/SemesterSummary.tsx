
import React, { useMemo } from 'react';
import { Course, Area, CourseStatus } from '../types';

interface SemesterSummaryProps {
  courses: Course[];
  areas: Area[];
  onEditCourse: (course: Course) => void;
}

export const SemesterSummary: React.FC<SemesterSummaryProps> = ({ courses, areas, onEditCourse }) => {
  const semesterData = useMemo(() => {
    const sems: Record<number, { 
      ects: number; 
      passedEcts: number;
      courses: Course[];
      avgGrade: number;
      distribution: Record<string, number>;
    }> = {};

    courses.forEach(course => {
      if (!sems[course.semester]) {
        sems[course.semester] = { 
          ects: 0, 
          passedEcts: 0, 
          courses: [], 
          avgGrade: 0, 
          distribution: {} 
        };
      }
      sems[course.semester].courses.push(course);
      sems[course.semester].ects += course.ects;
      if (course.status === CourseStatus.Passed) {
        sems[course.semester].passedEcts += course.ects;
      }
      
      const areaKey = course.area.split(':')[0]; // Use "A", "B", etc.
      sems[course.semester].distribution[areaKey] = (sems[course.semester].distribution[areaKey] || 0) + course.ects;
    });

    // Calculate averages
    Object.keys(sems).forEach(semKey => {
      const s = sems[Number(semKey)];
      const graded = s.courses.filter(c => c.grade && c.status === CourseStatus.Passed);
      if (graded.length > 0) {
        s.avgGrade = graded.reduce((sum, c) => sum + (c.grade! * c.ects), 0) / graded.reduce((sum, c) => sum + c.ects, 0);
      }
      // Sort courses by name within the semester
      s.courses.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.entries(sems).sort(([a], [b]) => Number(a) - Number(b));
  }, [courses]);

  if (semesterData.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="text-slate-900 font-bold">No Academic Data</h3>
          <p className="text-slate-500 text-sm mt-2">Start by adding modules to your curriculum or importing your transcript.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academic Journey</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Timeline analysis of your degree progress.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Semesters</p>
             <p className="text-xl font-black text-slate-900 tabular-nums leading-none mt-1">{semesterData.length}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enrollments</p>
             <p className="text-xl font-black text-slate-900 tabular-nums leading-none mt-1">{courses.length}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {semesterData.map(([sem, data]) => {
          const isHeavyLoad = data.ects > 30;
          return (
            <div key={sem} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col overflow-hidden group">
              {/* Card Header & Summary Stats */}
              <div className="p-8 border-b border-slate-50 bg-slate-50/20 group-hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Semester {sem}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {data.courses.length} Modules Total
                      </span>
                      {isHeavyLoad && (
                        <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">Peak Workload</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">
                      {data.avgGrade > 0 ? data.avgGrade.toFixed(2) : '—'}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">GPA</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Course Completion</span>
                    <span className={`text-[12px] font-black tabular-nums ${isHeavyLoad ? 'text-orange-500' : 'text-slate-900'}`}>
                      {data.passedEcts} / {data.ects} ECTS
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                     {/* Applied wave-progress-fill here */}
                     <div 
                      className="h-full wave-progress-fill transition-all duration-1000 ease-out" 
                      style={{ width: `${(data.passedEcts / Math.max(30, data.ects)) * 100}%` }}
                     ></div>
                  </div>
                </div>

                {/* Area Distribution */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.distribution).map(([area, ects]) => {
                    const areaConfig = areas.find(a => a.id.startsWith(area));
                    return (
                      <div 
                        key={area} 
                        className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm"
                      >
                        <div className={`w-2 h-2 rounded-full ${areaConfig?.color || 'bg-slate-300'}`}></div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tabular-nums">{area}: {ects}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Course Detailed List */}
              <div className="flex-1 overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Module Name</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">ECTS</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Grade</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800 leading-tight">{course.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{course.area.split(':')[0]}</p>
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-slate-500 tabular-nums text-xs">
                          {course.ects}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className={`text-sm font-black tabular-nums ${course.grade ? 'text-slate-900' : 'text-slate-300 italic'}`}>
                            {course.grade ? course.grade.toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => onEditCourse(course)}
                                className="p-1.5 text-slate-300 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                title="Edit Module"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                 </svg>
                              </button>
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest min-w-[80px] text-center ${
                                course.status === CourseStatus.Passed ? 'bg-green-100 text-green-700' :
                                course.status === CourseStatus.InProgress ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {course.status}
                              </span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Footer Decor */}
              <div className="px-8 py-4 bg-slate-50/20 border-t border-slate-50 flex justify-between items-center">
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Passau Degree Tracker</p>
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
