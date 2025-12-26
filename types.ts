
export enum ModuleArea {
  A = 'A: Foundation',
  B = 'B: Research',
  C = 'C: Specialisation',
  D = 'D: Transfer',
  Thesis = 'Master Thesis'
}

export type AreaBehavior = 'standard' | 'groups' | 'thesis';

export interface Area {
  id: string;
  name: string;
  required: number;
  description: string;
  color: string; // Tailwind class
  behavior: AreaBehavior;
}

export enum CourseStatus {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Passed = 'Passed',
  Failed = 'Failed'
}

export interface Course {
  id: string;
  name: string;
  ects: number;
  grade?: number; // German grading system 1.0 - 5.0
  semester: number;
  area: string; // References Area.id
  status: CourseStatus;
  subGroup?: string; // For Module C groups
  examDate?: string; // ISO string for date/time
}

export interface UserProfile {
  fullName: string;
  program: string;
  matriculationNumber: string;
  targetGraduation?: string;
  profilePicture?: string; // Base64 encoded image
  universityLogo?: string; // Base64 encoded logo image
  degreeType: string; // e.g. "Master of Arts"
  enrollmentDate?: string;
}

export interface AreaStats {
  area: string;
  current: number;
  required: number;
  completedCourses: number;
}

export const MODULE_C_GROUPS = [
  "Economics",
  "Southeast Asian Studies",
  "Sociology and Politics",
  "Sustainability and Resources",
  "Geographies of Development"
];

export type SortField = 'semester' | 'name' | 'ects' | 'grade' | 'examDate';
export type SortOrder = 'asc' | 'desc';
