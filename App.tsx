
import React, { useState, useEffect, useMemo } from 'react';
import { Course, ModuleArea, CourseStatus, Area, SortField, SortOrder, UserProfile } from './types';
import { INITIAL_COURSES_EXAMPLE, DEFAULT_AREAS } from './constants';
import { DashboardHeader } from './components/DashboardHeader';
import { ModuleSection } from './components/ModuleSection';
import { AddCourseModal } from './components/AddCourseModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ImportTranscriptModal } from './components/ImportTranscriptModal';
import { ManageAreasModal } from './components/ManageAreasModal';
import { ExportReportModal } from './components/ExportReportModal';
import { WelcomePage } from './components/WelcomePage';
import { UserProfileModal } from './components/UserProfileModal';
import { SemesterSummary } from './components/SemesterSummary';
import { ExamTimetable } from './components/ExamTimetable';

const generateId = () => Math.random().toString(36).substring(2, 15);

const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  program: "M.A. Development Studies",
  matriculationNumber: "",
  degreeType: "Master of Arts",
  enrollmentDate: "",
};

type ViewMode = 'analytics' | 'curriculum' | 'timetable';

const App: React.FC = () => {
  // Lazy initialization
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('passau_tracker_courses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_COURSES_EXAMPLE; }
    }
    return INITIAL_COURSES_EXAMPLE;
  });

  const [areas, setAreas] = useState<Area[]>(() => {
    const saved = localStorage.getItem('passau_tracker_areas');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_AREAS; }
    }
    return DEFAULT_AREAS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('passau_tracker_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_PROFILE; }
    }
    return DEFAULT_PROFILE;
  });

  const [showDashboard, setShowDashboard] = useState(() => {
    return localStorage.getItem('passau_tracker_entered') === 'true';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('passau_tracker_view') as ViewMode) || 'analytics';
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Persistence
  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem('passau_tracker_courses', JSON.stringify(courses));
    const timer = setTimeout(() => setIsSaving(false), 500);
    return () => clearTimeout(timer);
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('passau_tracker_areas', JSON.stringify(areas));
  }, [areas]);

  useEffect(() => {
    localStorage.setItem('passau_tracker_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('passau_tracker_view', viewMode);
  }, [viewMode]);

  // Global View State
  const [sortField, setSortField] = useState<SortField>('semester');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterSemester, setFilterSemester] = useState<number | 'all'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isManageAreasModalOpen, setIsManageAreasModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleEnterApp = () => {
    setShowDashboard(true);
    localStorage.setItem('passau_tracker_entered', 'true');
  };

  const handleExitToCover = () => {
    setShowDashboard(false);
    localStorage.setItem('passau_tracker_entered', 'false');
  };

  const handleClearAllData = () => {
    if (confirm("This will permanently delete all your data. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSaveCourse = (data: Omit<Course, 'id'>) => {
    if (courseToEdit) {
      setCourses(courses.map(c => c.id === courseToEdit.id ? { ...data, id: courseToEdit.id } : c));
    } else {
      const newCourse: Course = { ...data, id: generateId() };
      setCourses([...courses, newCourse]);
    }
    setIsModalOpen(false);
    setCourseToEdit(null);
  };

  const handleImportCourses = (importedCourses: Partial<Course>[]) => {
    const newCourses = importedCourses.map(c => ({
      ...c,
      id: generateId(),
      area: c.area || DEFAULT_AREAS[0].id,
      status: c.status || CourseStatus.Passed,
      ects: c.ects || 0,
      semester: c.semester || 1,
      name: c.name || "Unknown Course"
    } as Course));

    setCourses(prev => [...prev, ...newCourses]);
    setIsImportModalOpen(false);
  };

  const handleJsonBackup = () => {
    const exportData = {
      userProfile,
      courses,
      areas,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uniplanner_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const initiateDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      setCourseToDelete(course);
      setDeleteModalOpen(true);
    }
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const openAddModal = () => {
    setCourseToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setCourseToEdit(course);
    setIsModalOpen(true);
  };

  const updateCourseStatus = (id: string, status: CourseStatus) => {
    setCourses(courses.map(c => c.id === id ? { ...c, status } : c));
  };

  const courseCounts = courses.reduce((acc, course) => {
    acc[course.area] = (acc[course.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allSemesters = useMemo(() => {
    const sems = new Set(courses.map(c => c.semester));
    return Array.from(sems).sort((a, b) => Number(a) - Number(b));
  }, [courses]);

  if (!showDashboard) {
    return <WelcomePage onEnter={handleEnterApp} />;
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 bg-slate-50/50">
      <DashboardHeader 
        courses={courses} 
        areas={areas}
        userProfile={userProfile}
        isSaving={isSaving}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
        onManageAreasClick={() => setIsManageAreasModalOpen(true)}
        onClearData={handleClearAllData}
        onExitToCover={handleExitToCover}
        sortField={sortField}
        sortOrder={sortOrder}
        filterSemester={filterSemester}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onFilterSemesterChange={setFilterSemester}
        availableSemesters={allSemesters}
      />

      <main className="max-w-5xl mx-auto px-4">
        {/* Navigation Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex gap-1 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                viewMode === 'analytics' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semester Analytics
            </button>
            <button 
              onClick={() => setViewMode('curriculum')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                viewMode === 'curriculum' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Module Curriculum
            </button>
            <button 
              onClick={() => setViewMode('timetable')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                viewMode === 'timetable' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Exam Timetable
            </button>
          </div>
        </div>

        {/* Conditional View Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {viewMode === 'analytics' && (
            <SemesterSummary 
              courses={courses} 
              areas={areas}
              onEditCourse={openEditModal} 
            />
          )}
          {viewMode === 'curriculum' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {areas.map(area => (
                <div key={area.id} className={area.behavior === 'groups' ? "lg:col-span-2" : ""}>
                  <ModuleSection 
                      area={area}
                      courses={courses.filter(c => c.area === area.id)}
                      onDeleteCourse={initiateDeleteCourse}
                      onEditCourse={openEditModal}
                      onStatusChange={updateCourseStatus}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      filterSemester={filterSemester}
                      onSortFieldChange={setSortField}
                      onSortOrderChange={setSortOrder}
                  />
                </div>
              ))}
            </div>
          )}
          {viewMode === 'timetable' && (
            <ExamTimetable 
              courses={courses} 
              areas={areas}
              onEditCourse={openEditModal}
            />
          )}
        </div>
      </main>

      <button 
        onClick={openAddModal}
        className="fixed bottom-8 right-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-4 shadow-xl shadow-slate-200 transition-transform hover:scale-105 active:scale-95 z-40"
        aria-label="Add Course"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
        </svg>
      </button>

      <AddCourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCourse}
        initialData={courseToEdit}
        existingCourses={courses}
        availableAreas={areas}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteCourse}
        courseName={courseToDelete?.name || ''}
      />

      <ImportTranscriptModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCourses}
      />

      <ManageAreasModal 
        isOpen={isManageAreasModalOpen}
        onClose={() => setIsManageAreasModalOpen(false)}
        areas={areas}
        onUpdateAreas={setAreas}
        courseCounts={courseCounts}
      />

      <ExportReportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        courses={courses}
        areas={areas}
        userProfile={userProfile}
        onDownloadJson={handleJsonBackup}
      />

      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={setUserProfile}
      />
    </div>
  );
};

export default App;
