import React, { useState, useEffect, useRef } from 'react';
import { Area, AreaBehavior } from '../types';
import { AREA_COLORS } from '../constants';
import { analyzeCurriculumStructure } from '../services/geminiService';

interface ManageAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: Area[];
  onUpdateAreas: (areas: Area[]) => void;
  courseCounts: Record<string, number>;
}

export const ManageAreasModal: React.FC<ManageAreasModalProps> = ({ 
  isOpen, 
  onClose, 
  areas, 
  onUpdateAreas,
  courseCounts
}) => {
  const [localAreas, setLocalAreas] = useState<Area[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [architectFile, setArchitectFile] = useState<File | null>(null);
  
  const architectInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Area | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalAreas([...areas]);
      setIsArchitectMode(false);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setArchitectFile(null);
    }
  }, [isOpen, areas]);

  const handleEdit = (area: Area) => {
    setEditingId(area.id);
    setFormData({ ...area });
  };

  const handleAddNew = () => {
    const newId = `custom_${Date.now()}`;
    const newArea: Area = {
      id: newId,
      name: 'New Module Area',
      required: 10,
      description: 'Custom module area',
      color: 'bg-slate-700',
      behavior: 'standard'
    };
    setLocalAreas([...localAreas, newArea]);
    setEditingId(newId);
    setFormData(newArea);
  };

  const handleSaveEdit = () => {
    if (formData && editingId) {
      setLocalAreas(localAreas.map(a => a.id === editingId ? formData : a));
      setEditingId(null);
      setFormData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(null);
  };

  const handleDelete = (id: string) => {
    if (courseCounts[id] && courseCounts[id] > 0) {
      alert(`Cannot delete this area because it contains ${courseCounts[id]} courses. Please move or delete the courses first.`);
      return;
    }
    if (confirm("Are you sure you want to delete this area?")) {
      setLocalAreas(localAreas.filter(a => a.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormData(null);
      }
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchitectFile(file);
      setAnalysisError(null);
    }
  };

  const handleArchitectUpload = async () => {
    if (!architectFile) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const suggestedAreas = await analyzeCurriculumStructure(architectFile);
      if (suggestedAreas.length > 0) {
        setLocalAreas(suggestedAreas);
        setIsArchitectMode(false);
        setArchitectFile(null);
      } else {
        setAnalysisError("The document was recognized but no module areas were found. Please try a more detailed page.");
      }
    } catch (err: any) {
      setAnalysisError(err?.message || "Structural analysis failed. Ensure the document is clear and readable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAll = () => {
    onUpdateAreas(localAreas);
    onClose();
  };

  if (!isOpen) return null;

  const isPdf = architectFile?.type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-slate-900 px-10 py-8 flex justify-between items-center flex-shrink-0 relative overflow-hidden">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
           <div className="relative z-10">
              <h3 className="text-white font-black text-2xl tracking-tight">Curriculum Architect</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">AI Program Design & ECTS Logic</p>
           </div>
           <div className="flex items-center gap-4 relative z-10">
              <button 
                onClick={() => setIsArchitectMode(!isArchitectMode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isArchitectMode ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                {isArchitectMode ? 'Manual Mode' : 'AI Architect'}
              </button>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar relative">
          
          {isArchitectMode ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
               {isAnalyzing ? (
                 <div className="flex flex-col items-center gap-6">
                    <div className="relative w-24 h-24">
                       <div className="absolute inset-0 bg-rose-100 rounded-[2rem] animate-ping opacity-20"></div>
                       <div className="absolute inset-0 border-4 border-rose-600/20 rounded-[2rem]"></div>
                       <div className="absolute inset-0 border-4 border-rose-600 rounded-[2rem] animate-[spin_3s_linear_infinite] clip-path-top"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                       </div>
                    </div>
                    <div>
                       <p className="text-xl font-black text-slate-900 tracking-tight">Architecting Curriculum</p>
                       <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.3em] mt-2">Extracting Program Logic...</p>
                    </div>
                 </div>
               ) : (
                 <div className="max-w-md space-y-10">
                    <div className="space-y-4">
                       <h4 className="text-3xl font-black text-slate-900 tracking-tighter">AI Program Import</h4>
                       <p className="text-slate-500 font-medium text-sm leading-relaxed">
                          Upload your program handbook, structural overview, or regulations (PDF/PNG/JPG). Our AI identifies ECTS targets and module dependencies automatically.
                       </p>
                    </div>
                    
                    {analysisError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-500 uppercase tracking-wide">
                        {analysisError}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div 
                        onClick={() => architectInputRef.current?.click()}
                        className={`group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-12 transition-all flex flex-col items-center gap-6 ${architectFile ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-50/10'}`}
                      >
                         <input 
                           type="file" 
                           ref={architectInputRef} 
                           className="hidden" 
                           accept="image/*,application/pdf"
                           onChange={handleFileSelection}
                         />
                         <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-xl ${architectFile ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                            {isPdf ? (
                               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                               </svg>
                            )}
                         </div>
                         <div className="space-y-1">
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] block ${architectFile ? 'text-rose-600' : 'text-slate-400'}`}>
                              {architectFile ? architectFile.name : 'Select Document'}
                            </span>
                            {!architectFile && <span className="text-[9px] text-slate-300 uppercase tracking-widest font-bold">PDF, PNG, or JPG accepted</span>}
                         </div>
                      </div>

                      {architectFile && (
                        <button 
                          onClick={handleArchitectUpload}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 transition-all hover:bg-slate-800 active:scale-95"
                        >
                          Synthesize Program
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={() => setIsArchitectMode(false)}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      Return to Manual Configuration
                    </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 gap-4">
                {localAreas.map((area) => (
                  <div key={area.id} className="bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {editingId === area.id && formData ? (
                      <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Group Title</label>
                            <input 
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ECTS Quota</label>
                            <input 
                              type="number"
                              value={formData.required}
                              onChange={e => setFormData({...formData, required: Number(e.target.value)})}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Structural Rules</label>
                            <input 
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Behavioral Logic</label>
                              <select 
                                value={formData.behavior}
                                onChange={e => setFormData({...formData, behavior: e.target.value as AreaBehavior})}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none appearance-none"
                              >
                                 <option value="standard">Standard ECTS Accumulation</option>
                                 <option value="groups">Specialisation Groups (Category Rules)</option>
                                 <option value="thesis">Master Thesis Progression</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Palette</label>
                              <div className="flex flex-wrap gap-2.5">
                                {AREA_COLORS.map(c => (
                                  <button
                                    key={c.class}
                                    type="button"
                                    onClick={() => setFormData({...formData, color: c.class})}
                                    className={`w-8 h-8 rounded-full ${c.class} transition-all ${formData.color === c.class ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'}`}
                                  />
                                ))}
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                          <button onClick={handleCancelEdit} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                          <button onClick={handleSaveEdit} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">Update Area</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-8 group">
                        <div className="flex items-center gap-6">
                          <div className={`w-3 h-14 rounded-full ${area.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                          <div>
                            <h4 className="font-black text-slate-900 text-lg tracking-tight">{area.name}</h4>
                            <p className="text-slate-400 text-xs font-medium max-w-sm truncate">{area.description}</p>
                            <div className="mt-2.5 flex gap-2">
                               <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg uppercase tracking-widest">{area.required} ECTS</span>
                               {area.behavior !== 'standard' && (
                                 <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg uppercase tracking-widest">{area.behavior} Logic</span>
                               )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEdit(area)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                              </svg>
                           </button>
                           <button 
                             onClick={() => handleDelete(area.id)} 
                             className={`w-10 h-10 flex items-center justify-center transition-all rounded-full ${courseCounts[area.id] > 0 ? 'text-slate-100 cursor-not-allowed' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                             disabled={courseCounts[area.id] > 0}
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                              </svg>
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddNew}
                disabled={!!editingId}
                className="w-full border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-rose-400 hover:text-rose-600 hover:bg-white transition-all disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Manually Define Module Group</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-white">
          <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Close</button>
          <button onClick={saveAll} className="px-10 py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl shadow-slate-300 transition-all active:scale-95">
             Apply Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
