import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';

export type Stats = {
  totalStudents: number;
  activeCourses: number;
  facultyMembers: number;
  totalEnrollments: number;
};

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiFetch<Stats>('/api/stats'),
  });
}
