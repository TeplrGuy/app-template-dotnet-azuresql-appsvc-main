import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';

export type Department = {
  departmentId: number;
  name: string;
  courseCount: number;
  instructorCount: number;
};

export function useDepartmentsList() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => apiFetch<Department[]>('/api/departments'),
  });
}
