import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';

export type Course = {
  courseId: number;
  title: string;
  credits: number;
  departmentId?: number | null;
  courseCode: string;
  description: string;
  departmentName: string;
  studentCount: number;
};

export const coursesQueryKeys = {
  all: ['courses'] as const,
  list: () => [...coursesQueryKeys.all, 'list'] as const,
};

export async function listCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/api/courses');
}

export function useCoursesList() {
  return useQuery({
    queryKey: coursesQueryKeys.list(),
    queryFn: listCourses,
  });
}
