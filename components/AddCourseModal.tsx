
import React, { useState, useEffect } from 'react';
import { CourseStatus, MODULE_C_GROUPS, Course, Area } from '../types';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => void;
  initialData?: Course | null;
  existingCourses: Course[];
  availableAreas: Area[];
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  existingCourses, 
  availableAreas 
}) => {
  const [name, setName] = useState('');
  const [ects, setEcts] = useState(5);
  const [semester, setSemester] = useState<number | string>(1);
  const [areaId, setAreaId] = useState<string>(availableAreas[0]?.id || '');
  const [status, setStatus] = useState<CourseStatus>(CourseStatus.Passed);
  const [subGroup, setSubGroup] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setName(initialData.name);
        setEcts(initialData.ects);
        setSemester(initialData.semester);
        setAreaId(initialData.area);
        setStatus(initialData.status);
        setSubGroup(initialData.subGroup || '');
        setGrade(initialData.grade ? initialData.grade.toString() : '');
        setExamDate(initialData.examDate || '');
      } else {
        setName('');
        setEcts(5);
        setSemester(1);
        setAreaId(availableAreas[0]?.id || '');
        setStatus(CourseStatus.Planned);
        setSubGroup('');
        setGrade('');
        setExamDate('');
      }
    }
  }, [isOpen, initialData, availableAreas]);

  if (!isOpen) return null;

  const selectedArea = availableAreas.find(a => a.id === areaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const semValue = Number(semester);
    if (!Number.isInteger(semValue) || semValue < 1) {
      setError("The semester must be a positive integer.");
      return;
    }
    
    if (semValue > 12) {
      setError("Please select a reasonable semester range (1-12).");
      return;
    }

    const isDuplicate = existingCourses.some(c => 
      c.name.trim().toLowerCase() === name.trim().toLowerCase() && 
      c.id !== initialData?.id
    );

    if (isDuplicate) {
      setError(`A course with the name "${name}" already exists.`);
      return;
    }

    if (!selectedArea) {
      setError("Please select a valid module area.");
      return;
    }

    onSave({
      name,
      ects: Number(ects),
      semester: semValue,
      area: areaId,
      status,
      subGroup: selectedArea.behavior === 'groups' ? subGroup : undefined,
      grade: grade ? Number(grade) : undefined,
      examDate: examDate || undefined
    });
    onClose();
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
            <h3 className="text-white font-semibold">{isEditing ? 'Edit Course' : 'Add New Course'}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Module Area</label>
            <select 
              value={areaId} 
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {availableAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Course Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Research Seminar"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">ECTS</label>
                <input 
                type="number" 
                value={ects}
                onChange={(e) => setEcts(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                min="0"
                required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Semester</label>
                <input 
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="12"
                  step="1"
                  required
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Status</label>
                <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CourseStatus)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                    {Object.values(CourseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Grade (Optional)</label>
                <input 
                type="number" 
                step="0.1"
                min="1.0"
                max="5.0"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1.3"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Exam Session / Reminder</label>
            <input 
              type="datetime-local" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
             >
                Cancel
             </button>
             <button 
                type="submit" 
                className="flex-1 py-3 px-4 bg-slate-900 rounded-xl text-white font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
             >
                {isEditing ? 'Update Module' : 'Add Module'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
