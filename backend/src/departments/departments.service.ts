import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type DepartmentDto = {
  departmentId: number;
  name: string;
  courseCount: number;
  instructorCount: number;
};

const seededDepartments: DepartmentDto[] = [
  { departmentId: 1, name: 'Computer Science', courseCount: 12, instructorCount: 2 },
  { departmentId: 2, name: 'Mathematics', courseCount: 8, instructorCount: 2 },
  { departmentId: 3, name: 'Physics', courseCount: 6, instructorCount: 1 },
  { departmentId: 4, name: 'English', courseCount: 10, instructorCount: 1 },
  { departmentId: 5, name: 'History', courseCount: 6, instructorCount: 0 },
];

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<DepartmentDto[]> {
    if (!process.env.SQLSERVER_CONNECTION_STRING) return seededDepartments;

    const items = await this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });

    return items.map((d) => ({
      departmentId: d.id,
      name: d.name,
      courseCount: d._count.courses,
      instructorCount: d.instructorId ? 1 : 0,
    }));
  }
}
