import { ModuleArea, CourseStatus, Area } from './types';

export const DEFAULT_AREAS: Area[] = [
  {
    id: ModuleArea.A,
    name: "A: Foundation",
    required: 15,
    description: "Methods, Theories, Interdisciplinary Seminar",
    color: "bg-orange-500",
    behavior: 'standard'
  },
  {
    id: ModuleArea.B,
    name: "B: Research",
    required: 25,
    description: "Methods, Colloquium I & II, Seminar",
    color: "bg-blue-500",
    behavior: 'standard'
  },
  {
    id: ModuleArea.C,
    name: "C: Specialisation",
    required: 40,
    description: "Must cover at least 3 of 5 module groups",
    color: "bg-emerald-500",
    behavior: 'groups'
  },
  {
    id: ModuleArea.D,
    name: "D: Transfer",
    required: 15,
    description: "Internship/Project, Languages",
    color: "bg-purple-500",
    behavior: 'standard'
  },
  {
    id: ModuleArea.Thesis,
    name: "Master Thesis",
    required: 25,
    description: "Requires 80 ECTS to register",
    color: "bg-slate-700",
    behavior: 'thesis'
  }
];

// Helper to keep backward compatibility if needed, though we should prefer the array
export const AREA_CONFIG = DEFAULT_AREAS.reduce((acc, area) => {
  acc[area.id] = area;
  return acc;
}, {} as Record<string, Area>);

export const TOTAL_ECTS_REQUIRED = 120;
export const THESIS_PREREQUISITE_ECTS = 80;

export const INITIAL_COURSES_EXAMPLE = [
  {
    id: '1',
    name: 'Methods and Theories of Development Research',
    ects: 5,
    semester: 1,
    area: ModuleArea.A,
    status: CourseStatus.Passed,
    grade: 2.0
  },
  {
    id: '2',
    name: 'Interdisciplinary Development Seminar',
    ects: 10,
    semester: 1,
    area: ModuleArea.A,
    status: CourseStatus.Passed,
    grade: 1.7
  }
];

export const AREA_COLORS = [
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Emerald', class: 'bg-emerald-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Slate', class: 'bg-slate-700' },
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
  { name: 'Yellow', class: 'bg-yellow-500' },
  { name: 'Indigo', class: 'bg-indigo-500' },
];