import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { parseTranscript } from '../services/geminiService';

interface ImportTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (courses: Partial<Course>[]) => void;
}

const MAX_FILE_SIZE_MB = 10;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ImportTranscriptModal: React.FC<ImportTranscriptModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'quota' | 'unreadable' | 'safety' | 'generic' | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [parsedCourses, setParsedCourses] = useState<Partial<Course>[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  // Handle retry countdown timer
  useEffect(() => {
    let timer: any;
    if (retryCountdown > 0) {
      timer = setInterval(() => {
        setRetryCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [retryCountdown]);

  // Loading animation steps
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setAnalysisStep(1);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 2500);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setErrorType(null);

    if (!selectedFile) return;

    if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
      setError("Unsupported file format. Please upload a JPG, PNG, or WebP image.");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const processFile = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const results = await parseTranscript(file);
      setParsedCourses(results);
      setStep('review');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      
      if (msg.includes("QUOTA_EXCEEDED")) {
        setErrorType('quota');
        setError("The academic advisor is momentarily overwhelmed (API Quota Limit). The system needs a short break to recover.");
        setRetryCountdown(30); // Start a 30s countdown
      } else if (msg.includes("The AI couldn't find") || msg.includes("UNREADABLE")) {
        setErrorType('unreadable');
        setError("We couldn't detect a clear module table. This happens if the image is blurry or if the transcript format is highly unusual.");
      } else if (msg.includes("SAFETY_BLOCKED")) {
        setErrorType('safety');
        setError("Analysis interrupted. The content was flagged by standard safety filters. Please ensure the image only contains academic records.");
      } else {
        setErrorType('generic');
        setError(msg || "An unexpected error occurred during analysis. Please check your network and try a different photo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onImport(parsedCourses);
    reset();
    onClose();
  };

  const reset = () => {
    setFile(null);
    setParsedCourses([]);
    setStep('upload');
    setError(null);
    setErrorType(null);
    setRetryCountdown(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const removeParsedCourse = (index: number) => {
    const updated = parsedCourses.filter((_, i) => i !== index);
    setParsedCourses(updated);
    if (updated.length === 0) setStep('upload');
  };

  const analysisSteps = [
    { id: 1, label: "Enhancing image clarity..." },
    { id: 2, label: "Scanning for module tables..." },
    { id: 3, label: "Extracting ECTS & Grades..." },
    { id: 4, label: "Categorizing specialisations..." },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center flex-shrink-0 relative overflow-hidden">
          {/* Subtle animated background in header */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-50 animate-pulse"></div>
          
          <div className="relative z-10">
             <h3 className="text-white font-black text-xl tracking-tight">AI Transcript Importer</h3>
             <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Vision Engine V2.0 • Passau Logic</p>
          </div>
          <button onClick={handleClose} className="relative z-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-slate-50/30">
          {step === 'upload' ? (
            <div className="space-y-8">
              {!isLoading && !error && (
                <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className={`mx-auto h-24 w-24 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-500 transform ${file ? 'bg-blue-600 text-white scale-110 shadow-xl shadow-blue-200' : 'bg-white border-2 border-dashed border-slate-200 text-slate-300'}`}>
                    {file ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    )}
                  </div>
                  <h4 className="text-slate-900 font-black text-2xl mb-2 tracking-tight">{file ? file.name : 'Photo Import'}</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                    Upload your HISQIS transcript or a clear photo of your module overview for automatic data extraction.
                  </p>
                </div>
              )}

              {/* Upload Dropzone */}
              {!isLoading && !error && (
                <div className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300 ${file ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-inner'}`}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-4">
                     <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl text-xs font-black text-white uppercase tracking-[0.2em] transition-transform hover:scale-105 active:scale-95">
                       {file ? 'Change Selection' : 'Choose Document'}
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                        JPG • PNG • WEBP (MAX 10MB)
                     </p>
                  </div>
                </div>
              )}

              {/* Enhanced Error Feedback */}
              {!isLoading && error && (
                <div className="animate-in zoom-in-95 duration-500">
                  <div className="bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-50 p-8 overflow-hidden relative">
                    {/* Background red glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                      </div>
                      
                      <h5 className="text-xl font-black text-slate-900 mb-3 tracking-tight">
                        {errorType === 'quota' ? 'System Busy' : errorType === 'unreadable' ? 'Document Not Recognized' : 'Extraction Error'}
                      </h5>
                      
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                        {error}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                         {errorType === 'quota' ? (
                           <button
                             onClick={processFile}
                             disabled={retryCountdown > 0}
                             className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg active:scale-95"
                           >
                             {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Try Again Now'}
                           </button>
                         ) : (
                           <button
                             onClick={() => { setError(null); setFile(null); }}
                             className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                           >
                             Retake Photo
                           </button>
                         )}
                         
                         <button
                           onClick={handleClose}
                           className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                         >
                           Manual Entry
                         </button>
                      </div>
                      
                      {errorType === 'unreadable' && (
                        <div className="mt-8 pt-8 border-t border-slate-100 w-full">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 text-left">Quality Checklist</p>
                          <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[11px] font-bold text-slate-600">Avoid Glares</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[11px] font-bold text-slate-600">Flat surface</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[11px] font-bold text-slate-600">Center tables</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[11px] font-bold text-slate-600">Good lighting</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analyzing View */}
              {isLoading && (
                <div className="py-12 flex flex-col items-center">
                   <div className="relative w-32 h-32 mb-10">
                      {/* Outer pulse */}
                      <div className="absolute inset-0 bg-blue-100 rounded-[2.5rem] animate-ping opacity-20"></div>
                      <div className="absolute inset-2 bg-blue-50 rounded-[2rem] animate-pulse"></div>
                      
                      {/* Rotating ring */}
                      <svg className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-100" />
                         <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600" strokeDasharray="60 300" strokeLinecap="round" />
                      </svg>

                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644l.711-1.266A11.056 11.056 0 0 1 12 7.25c4.921 0 9.203 3.278 10.702 7.808a1.012 1.012 0 0 1 0 .644l-.711 1.266A11.056 11.056 0 0 1 12 16.75a11.056 11.056 0 0 1-9.263-5.118l-.711-1.266ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                         </svg>
                      </div>
                   </div>

                   <style>{`
                     @keyframes scan {
                       0% { top: 10%; opacity: 0; }
                       20% { opacity: 1; }
                       80% { opacity: 1; }
                       100% { top: 90%; opacity: 0; }
                     }
                   `}</style>

                   <div className="text-center space-y-4">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight">Analyzing Document</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Vision Core Engaged</p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 pt-4">
                         {analysisSteps.map(s => (
                           <div key={s.id} className={`flex items-center gap-3 transition-all duration-500 ${analysisStep >= s.id ? 'opacity-100' : 'opacity-20 scale-95'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${analysisStep === s.id ? 'bg-blue-600 animate-pulse' : analysisStep > s.id ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                              <span className={`text-[11px] font-bold ${analysisStep === s.id ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {!isLoading && !error && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={processFile}
                    disabled={!file}
                    className="group w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xl shadow-slate-300 relative overflow-hidden active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-4">
                       Start Analysis
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                       </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-4">
                 <div>
                    <h4 className="font-black text-slate-900 text-2xl tracking-tight">Confirm Data</h4>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">{parsedCourses.length} Modules Successfully Extracted</p>
                 </div>
                 <button 
                    onClick={() => setStep('upload')} 
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Re-upload
                  </button>
              </div>
              
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] sticky top-0 z-10">
                        <tr>
                        <th className="p-6 border-b border-slate-100">Module</th>
                        <th className="p-6 border-b border-slate-100 w-20 text-center">ECTS</th>
                        <th className="p-6 border-b border-slate-100 w-20 text-center">Grade</th>
                        <th className="p-6 border-b border-slate-100 w-32 text-center">Area</th>
                        <th className="p-6 border-b border-slate-100 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {parsedCourses.map((c, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="p-6">
                              <div className="font-black text-slate-800 tracking-tight leading-tight">{c.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Semester {c.semester}</div>
                            </td>
                            <td className="p-6 text-center font-bold text-slate-500 tabular-nums">{c.ects}</td>
                            <td className="p-6 text-center">
                               <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl font-black tabular-nums border ${c.grade ? 'bg-white text-slate-900 border-slate-200 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100 italic text-xs'}`}>
                                 {c.grade ? c.grade.toFixed(1) : '-'}
                               </div>
                            </td>
                            <td className="p-6 text-center">
                                <span className="inline-block px-3 py-1.5 rounded-lg text-[9px] font-black bg-slate-100 text-slate-500 uppercase tracking-tight border border-slate-200">
                                    {c.area?.split(':')[0]}
                                </span>
                            </td>
                            <td className="p-6 text-right">
                                <button 
                                    onClick={() => removeParsedCourse(idx)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Exclude from import"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button 
                   onClick={handleClose}
                   className="flex-1 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-slate-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                 >
                    Discard All
                 </button>
                 <button 
                   onClick={handleConfirm}
                   className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl shadow-slate-300 transition-all active:scale-95"
                 >
                    Merge into Curriculum
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
