import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';

export type Student = {
  studentId: number;
  firstName: string;
  lastName: string;
  enrollmentDate: string;
  email?: string;
  courseCount?: number;
};

export type PagedStudents = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: Student[];
};

export type StudentCreate = {
  firstName: string;
  lastName: string;
  enrollmentDate: string;
};

export const studentsQueryKeys = {
  all: ['students'] as const,
  list: (page: number, pageSize: number) =>
    [...studentsQueryKeys.all, 'list', page, pageSize] as const,
  detail: (studentId: number) =>
    [...studentsQueryKeys.all, 'detail', studentId] as const,
};

export async function listStudents(params: {
  page?: number;
  pageSize?: number;
}): Promise<PagedStudents> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  return apiFetch<PagedStudents>(`/api/students?${qs.toString()}`);
}

export async function getStudent(studentId: number): Promise<Student> {
  return apiFetch<Student>(`/api/students/${studentId}`);
}

export async function createStudent(body: StudentCreate): Promise<Student> {
  return apiFetch<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function useStudentsList(page: number, pageSize: number) {
  return useQuery({
    queryKey: studentsQueryKeys.list(page, pageSize),
    queryFn: () => listStudents({ page, pageSize }),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(studentId: number) {
  return useQuery({
    queryKey: studentsQueryKeys.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: Number.isFinite(studentId),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
    },
  });
}
