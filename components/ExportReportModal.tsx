import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Course, Area, CourseStatus, UserProfile } from '../types';
import { getAIReportSummary } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  areas: Area[];
  userProfile: UserProfile;
  onDownloadJson: () => void;
}

type ReportSortOption = 'semester' | 'module';

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ 
  isOpen, 
  onClose, 
  courses, 
  areas,
  userProfile,
  onDownloadJson
}) => {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortOption, setSortOption] = useState<ReportSortOption>('semester');
  
  const [studentName, setStudentName] = useState(userProfile.fullName);
  const [matriculationNumber, setMatriculationNumber] = useState(userProfile.matriculationNumber);

  useEffect(() => {
    if (isOpen) {
      setStudentName(userProfile.fullName);
      setMatriculationNumber(userProfile.matriculationNumber);
    }
  }, [isOpen, userProfile]);

  const coverRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const passedCourses = useMemo(() => 
    courses.filter(c => c.status === CourseStatus.Passed), 
  [courses]);

  const sortedCourses = useMemo(() => {
    return [...passedCourses].sort((a, b) => {
      if (sortOption === 'semester') {
        if (a.semester !== b.semester) return a.semester - b.semester;
        const indexA = areas.findIndex(ar => ar.id === a.area);
        const indexB = areas.findIndex(ar => ar.id === b.area);
        if (indexA !== indexB) return indexA - indexB;
        return a.name.localeCompare(b.name);
      } else {
        const indexA = areas.findIndex(ar => ar.id === a.area);
        const indexB = areas.findIndex(ar => ar.id === b.area);
        if (indexA !== indexB) return indexA - indexB;
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.name.localeCompare(b.name);
      }
    });
  }, [passedCourses, sortOption, areas]);

  if (!isOpen) return null;

  const totalEcts = passedCourses.reduce((sum, c) => sum + c.ects, 0);
  const gradedCourses = passedCourses.filter(c => c.grade && c.grade > 0);
  const averageGrade = gradedCourses.length > 0 
    ? (gradedCourses.reduce((sum, c) => sum + (c.grade! * c.ects), 0) / gradedCourses.reduce((sum, c) => sum + c.ects, 0)).toFixed(2)
    : "N/A";

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const summary = await getAIReportSummary(courses, areas);
    setAiSummary(summary);
    setIsGenerating(false);
  };

  const captureElement = async (element: HTMLElement | null, scale = 2.5) => {
    if (!element) return null;
    await document.fonts.ready;
    return await html2canvas(element, {
      scale: scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  const handleDownloadPng = async () => {
    if (containerRef.current) {
      setIsExporting(true);
      try {
        const canvas = await captureElement(containerRef.current);
        if (canvas) {
          const link = document.createElement('a');
          link.download = `UniPlanner_Academic_Report_${new Date().toISOString().slice(0,10)}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
        }
      } catch (e) {
        console.error("Export failed", e);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const coverCanvas = await captureElement(coverRef.current);
      const reportCanvas = await captureElement(reportRef.current);
      
      if (coverCanvas && reportCanvas) {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const coverData = coverCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(coverData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        pdf.addPage();
        const reportData = reportCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(reportData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        pdf.save(`UniPlanner_Academic_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      }
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name || areaId;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-6xl bg-slate-50/50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-white/20">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-white border-r border-slate-100 p-8 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
          <button 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2 -mx-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all group font-bold text-[10px] uppercase tracking-widest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Dashboard
          </button>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900/90 tracking-tighter">Export</h2>
            <p className="text-xs font-semibold text-slate-400/80 tracking-wide">Generate archival-grade progress summaries.</p>
          </div>

          <div className="space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400/60 uppercase tracking-[0.3em] block">Student Verification</label>
                <div className="space-y-2">
                   <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                  <input 
                    type="text" 
                    value={matriculationNumber}
                    onChange={(e) => setMatriculationNumber(e.target.value)}
                    placeholder="Matriculation Number"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
             </div>

             <div>
                <label className="text-[10px] font-black text-slate-400/60 uppercase tracking-[0.3em] block mb-4">Structure Logic</label>
                <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/40">
                  <button
                      onClick={() => setSortOption('semester')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOption === 'semester' ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      Semester
                  </button>
                  <button
                      onClick={() => setSortOption('module')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOption === 'module' ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      Module
                  </button>
                </div>
             </div>

             <div className="p-6 rounded-[2rem] bg-indigo-50/40 border border-indigo-100/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-[10px] font-black text-indigo-600/70 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
                   Academic Advisory
                </h3>
                
                {aiSummary ? (
                   <div className="space-y-4 animate-in fade-in duration-500">
                      <textarea 
                        value={aiSummary}
                        onChange={(e) => setAiSummary(e.target.value)}
                        className="w-full h-32 p-3 bg-white/60 border border-indigo-100 rounded-xl text-[11px] font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none custom-scrollbar"
                        placeholder="Customize evaluation..."
                      />
                      <button 
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        {isGenerating ? "Refining..." : "Regenerate Analysis"}
                      </button>
                   </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500/80 mb-5 leading-relaxed font-medium">Inject a dynamically generated executive summary into the cover page.</p>
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating || isExporting}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 disabled:opacity-50 transition-all uppercase tracking-[0.2em] shadow-xl shadow-slate-200"
                    >
                      {isGenerating ? "Synthesizing..." : "Analyze Journey"}
                    </button>
                  </>
                )}
             </div>
          </div>

          <div className="mt-auto space-y-3 pt-8 border-t border-slate-100">
             <button 
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl shadow-slate-300 transition-all disabled:opacity-70 active:scale-95"
             >
                Produce PDF
             </button>
             <button 
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all disabled:opacity-70 active:scale-95"
             >
                Produce Image
             </button>
             <button 
                onClick={onDownloadJson}
                className="w-full py-2 text-slate-300 hover:text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] transition-colors"
             >
                Archive .json
             </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-200/50 p-12 flex justify-center custom-scrollbar">
          <div ref={containerRef} className="flex flex-col gap-20 bg-transparent">
            
            {/* Page 1: Cover */}
            <div ref={coverRef} className="w-[210mm] h-[297mm] bg-white p-[35mm] flex flex-col relative overflow-hidden shrink-0 shadow-[0_40px_100px_-12px_rgba(0,0,0,0.15)]">
               {/* Minimalist Grid Pattern Background */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
               
               {/* High-end Accent Lines */}
               <div className="absolute top-[35mm] left-[35mm] w-[120px] h-[2px] bg-slate-900/90"></div>
               <div className="absolute top-[35mm] left-[35mm] w-[2px] h-[120px] bg-slate-900/90"></div>

               <div className="flex justify-between items-start mb-48">
                  <div className="pt-8">
                    <h1 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300/80 mb-3 leading-none">University of Passau</h1>
                    <p className="text-[16px] font-black uppercase tracking-[0.15em] text-slate-900/90">M.A. Development Studies</p>
                  </div>
                  {userProfile.universityLogo ? (
                    <img src={userProfile.universityLogo} alt="Seal" className="h-24 w-auto opacity-90 filter grayscale" />
                  ) : (
                    <div className="w-24 h-24 border border-slate-100 rounded-full flex items-center justify-center opacity-20">
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>
                    </div>
                  )}
               </div>

               <div className="mb-40 flex flex-col items-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-400 mb-8 ml-1">Journey Transcript</p>
                  <div className="flex items-end gap-6">
                    <h2 className="text-[72px] font-black text-slate-900/90 tracking-tighter leading-[0.9]">Academic<br/>Summary</h2>
                    <div className="h-[140px] w-px bg-slate-100 mb-2"></div>
                    <div className="flex flex-col justify-end h-full mb-3">
                       <p className="text-[14px] font-black text-slate-900/40 tabular-nums">VER. 2.0</p>
                       <p className="text-[10px] font-black text-slate-900/30 uppercase tracking-widest mt-1">Passau System</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-x-24 gap-y-16 mb-auto">
                  <div className="relative pl-8 border-l border-slate-100">
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400/80 mb-4">Identity</p>
                     <p className="text-[22px] font-black text-slate-900/90 tracking-tight leading-none mb-2">{studentName || 'Unregistered Candidate'}</p>
                     <p className="text-[13px] text-slate-500/80 font-bold uppercase tracking-wide">ID: {matriculationNumber || 'Not provided'}</p>
                  </div>
                  <div className="relative pl-8 border-l border-slate-100">
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400/80 mb-4">Progression</p>
                     <p className="text-[22px] font-black text-slate-900/90 tracking-tight leading-none mb-2">{totalEcts} <span className="text-[14px] font-bold text-slate-300">/ 120 ECTS</span></p>
                     <p className="text-[13px] text-slate-500/80 font-bold uppercase tracking-wide italic">GPA: {averageGrade}</p>
                  </div>
               </div>

               {aiSummary && (
                 <div className="mt-20 pt-16 border-t border-slate-100 relative">
                   <div className="absolute -top-4 left-0 text-[32px] font-serif text-indigo-500/30">“</div>
                   <p className="text-[8px] font-black uppercase tracking-[0.5em] text-indigo-500/70 mb-6">Executive Advisor Assessment</p>
                   <p className="text-[16px] text-slate-700/90 leading-relaxed font-medium italic opacity-90 pr-10 max-w-[650px]">
                     {aiSummary}
                   </p>
                 </div>
               )}

               <div className="absolute bottom-[35mm] left-[35mm] right-[35mm] flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">Official Non-Official Document</p>
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">© UniPlanner Journey Tracker</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mb-1">Authenticated</p>
                    <p className="text-[13px] font-black text-slate-900/80 tabular-nums">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
                  </div>
               </div>
            </div>

            {/* Page 2: Transcript */}
            <div ref={reportRef} className="w-[210mm] h-[297mm] bg-white p-[35mm] flex flex-col shrink-0 shadow-[0_40px_100px_-12px_rgba(0,0,0,0.15)]">
               <div className="flex justify-between items-end pb-12 border-b-2 border-slate-900/90 mb-16">
                  <div>
                    <h3 className="text-[28px] font-black text-slate-900/90 tracking-tighter leading-none">Curriculum Records</h3>
                    <p className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.4em] mt-3">Verified Academic Progression</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-900/80 uppercase tracking-widest leading-none">{studentName}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-2">Page 02 // Records</p>
                  </div>
               </div>

               <table className="w-full text-left mb-20">
                  <thead className="text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 text-slate-300">
                     <tr>
                        <th className="pb-6 pr-4">Module Identifier & Name</th>
                        <th className="pb-6 px-4 w-24 text-center">Semester</th>
                        <th className="pb-6 px-4 w-24 text-center">ECTS</th>
                        <th className="pb-6 pl-4 w-24 text-right">Result</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                     {sortedCourses.map((course, i) => (
                        <tr key={i} className="text-slate-800 group">
                           <td className="py-7 pr-6">
                              <p className="text-[14px] font-black text-slate-900/90 tracking-tight leading-snug">{course.name}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${areas.find(a => a.id === course.area)?.color || 'bg-slate-200'} opacity-60`}></div>
                                <p className="text-[9px] font-black text-slate-400/70 uppercase tracking-widest">{getAreaName(course.area)}</p>
                              </div>
                           </td>
                           <td className="py-7 px-4 text-center tabular-nums text-[13px] font-bold text-slate-500/80">S{course.semester}</td>
                           <td className="py-7 px-4 text-center tabular-nums text-[13px] font-black text-slate-900/80">{course.ects}</td>
                           <td className="py-7 pl-4 text-right tabular-nums text-[14px] font-black text-slate-900/90">
                              {course.grade ? course.grade.toFixed(1) : <span className="text-[10px] uppercase text-slate-300 tracking-widest">Pass</span>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>

               <div className="mt-auto pt-16 border-t border-slate-900/10 flex justify-between items-start">
                  <div className="max-w-[400px]">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 mb-4">Certification Note</p>
                     <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic opacity-80">
                        This digital record is generated by the UniPlanner system based on student-provided data. It is intended for planning purposes and internal verification. Academic validity resides solely with HISQIS official transcripts.
                     </p>
                  </div>
                  <div className="flex gap-10">
                    <div className="text-center px-6">
                       <p className="text-[32px] font-black text-slate-900/90 tabular-nums leading-none tracking-tighter">{averageGrade}</p>
                       <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mt-3">Overall Avg</p>
                    </div>
                    <div className="text-center px-6 border-l border-slate-100">
                       <p className="text-[32px] font-black text-slate-900/90 tabular-nums leading-none tracking-tighter">{totalEcts}</p>
                       <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mt-3">Total ECTS</p>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
