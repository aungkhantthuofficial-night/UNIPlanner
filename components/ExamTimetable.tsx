import React, { useMemo } from 'react';
import { Course, CourseStatus, Area } from '../types';

interface ExamTimetableProps {
  courses: Course[];
  areas: Area[];
  onEditCourse: (course: Course) => void;
}

export const ExamTimetable: React.FC<ExamTimetableProps> = ({ courses, areas, onEditCourse }) => {
  const examCourses = useMemo(() => {
    return courses
      .filter(c => c.examDate)
      .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime());
  }, [courses]);

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return examCourses.filter(c => new Date(c.examDate!) > now);
  }, [examCourses]);

  const pastExams = useMemo(() => {
    const now = new Date();
    return examCourses.filter(c => new Date(c.examDate!) <= now);
  }, [examCourses]);

  const formatExamDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: date.toDateString() === new Date().toDateString()
    };
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (examCourses.length === 0) {
    return (
      <div className="py-20 text-center animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200/70 max-w-md mx-auto text-slate-900/90">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
          </div>
          <h3 className="text-slate-900/90 font-bold text-lg">Empty Timetable</h3>
          <p className="text-slate-500/70 text-sm mt-2 leading-relaxed">
            You haven't set any exam dates yet. Add a date to your modules to see your exam schedule here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900/90 tracking-tight">Exam Timetable</h2>
          <p className="text-slate-500/80 font-medium text-sm mt-1">Timeline analysis of your upcoming assessments.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500/80"></div>
              <div>
                <p className="text-[9px] font-bold text-slate-400/80 uppercase tracking-widest">Upcoming</p>
                <p className="text-lg font-black text-slate-900/90 tabular-nums leading-none">{upcomingExams.length}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Agenda View */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] mb-4">Upcoming Schedule</h3>
          <div className="space-y-4">
            {upcomingExams.length > 0 ? (
              upcomingExams.map(course => {
                const dateInfo = formatExamDate(course.examDate!);
                const daysLeft = getDaysUntil(course.examDate!);
                const area = areas.find(a => a.id === course.area);
                
                return (
                  <div 
                    key={course.id}
                    onClick={() => onEditCourse(course)}
                    className="bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer p-6 flex items-center gap-6 group"
                  >
                    <div className={`w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center border-2 ${dateInfo.isToday ? 'bg-blue-600/90 border-blue-500/80 text-white/95' : 'bg-slate-50 border-slate-100 text-slate-400/70'}`}>
                      <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{dateInfo.month}</span>
                      <span className="text-2xl font-black leading-none">{dateInfo.day}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${area?.color || 'bg-slate-300/60'}`}></span>
                        <span className="text-[9px] font-bold text-slate-400/70 uppercase tracking-widest">{area?.name.split(':')[0]}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900/90 truncate leading-tight group-hover:text-blue-600/90 transition-colors">
                        {course.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-slate-500/70 font-bold text-xs uppercase tracking-tight">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                           </svg>
                           {dateInfo.time}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500/70 font-bold text-xs uppercase tracking-tight">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                           </svg>
                           Uni Passau
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                       <p className={`text-[10px] font-black uppercase tracking-widest ${daysLeft <= 7 ? 'text-red-500/90' : 'text-slate-400/60'}`}>
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                       </p>
                       <div className="flex justify-end gap-1 mt-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${daysLeft <= 3 ? 'bg-red-500/80 animate-pulse' : 'bg-slate-200/50'}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full ${daysLeft <= 7 ? 'bg-red-400/80' : 'bg-slate-200/50'}`}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200/50"></div>
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 border-2 border-dashed border-slate-200/70 rounded-3xl text-center text-slate-400/60 font-medium italic">
                No upcoming exams scheduled.
              </div>
            )}
          </div>

          {pastExams.length > 0 && (
             <div className="pt-8">
                <h3 className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] mb-4">Past Sessions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastExams.map(course => (
                    <div 
                      key={course.id}
                      onClick={() => onEditCourse(course)}
                      className="bg-white/50 border border-slate-100/80 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white transition-all grayscale hover:grayscale-0"
                    >
                      <div className="min-w-0 text-slate-900/90">
                         <h5 className="font-bold text-slate-600/90 text-sm truncate">{course.name}</h5>
                         <p className="text-[10px] text-slate-400/70 font-medium uppercase tracking-tighter">
                           {new Date(course.examDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                         </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${course.status === CourseStatus.Passed ? 'bg-green-100/60 text-green-700/80' : 'bg-slate-100/60 text-slate-500/70'}`}>
                        {course.status}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        {/* Right Column: Reminders & Analytics */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-3xl p-8 text-white/95 shadow-xl shadow-slate-200/60 relative overflow-hidden">
              {/* Abstract decorative shape */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400/80 mb-6">Critical Alerts</h4>
              
              {upcomingExams.filter(c => getDaysUntil(c.examDate!) <= 7).length > 0 ? (
                <div className="space-y-4">
                  {upcomingExams.filter(c => getDaysUntil(c.examDate!) <= 7).map(c => (
                    <div key={c.id} className="flex items-start gap-4">
                       <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                       <div>
                          <p className="text-xs font-black text-white leading-tight mb-1">{c.name}</p>
                          <p className="text-[9px] font-bold text-red-400/90 uppercase tracking-widest">Starts in {getDaysUntil(c.examDate!)} days</p>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-emerald-400/90">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                   </div>
                   <p className="text-xs font-bold text-slate-400/80">No immediate deadlines.</p>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-white/10">
                 <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                    Sync with Calendar
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400/80 mb-6">Schedule Density</h4>
              <div className="space-y-6">
                {/* Visual distribution of exams per month could go here */}
                <div className="flex items-end justify-between gap-1 h-32">
                   {[3, 5, 2, 8, 4, 1].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                         <div 
                          className="w-full bg-slate-100 rounded-lg group-hover:bg-blue-500/80 transition-all relative overflow-hidden" 
                          style={{ height: `${val * 10}%` }}
                         >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:8px_8px]"></div>
                         </div>
                         <span className="text-[8px] font-bold text-slate-400/70 mt-2 uppercase">M{i+1}</span>
                      </div>
                   ))}
                </div>
                <p className="text-[10px] font-bold text-slate-500/80 leading-relaxed text-center">
                   Your peak assessment period is concentrated in <span className="text-blue-600/90">Month 4</span>. Plan accordingly.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};