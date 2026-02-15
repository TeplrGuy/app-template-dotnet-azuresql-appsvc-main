import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';

export type Instructor = {
  instructorId: number;
  firstName: string;
  lastName: string;
  hireDate: string;
  department: string;
  email: string;
  office: string;
};

export function useInstructorsList() {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: () => apiFetch<Instructor[]>('/api/instructors'),
  });
}
