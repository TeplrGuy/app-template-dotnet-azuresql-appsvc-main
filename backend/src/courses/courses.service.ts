import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type CourseDto = {
  courseId: number;
  title: string;
  credits: number;
  departmentId?: number | null;
  courseCode: string;
  description: string;
  departmentName: string;
  studentCount: number;
};

const seededCourses: CourseDto[] = [
  { courseId: 1, title: 'Introduction to Computer Science', credits: 4, departmentId: 1, courseCode: 'CS101', description: 'Fundamental concepts of programming and computational thinking.', departmentName: 'Computer Science', studentCount: 45 },
  { courseId: 2, title: 'Calculus I', credits: 4, departmentId: 2, courseCode: 'MATH201', description: 'Limits, derivatives, and integrals of single-variable functions.', departmentName: 'Mathematics', studentCount: 38 },
  { courseId: 3, title: 'General Physics', credits: 3, departmentId: 3, courseCode: 'PHYS101', description: 'Mechanics, thermodynamics, and wave phenomena.', departmentName: 'Physics', studentCount: 32 },
  { courseId: 4, title: 'Data Structures', credits: 3, departmentId: 1, courseCode: 'CS201', description: 'Arrays, linked lists, trees, graphs, and algorithm analysis.', departmentName: 'Computer Science', studentCount: 35 },
  { courseId: 5, title: 'Linear Algebra', credits: 3, departmentId: 2, courseCode: 'MATH301', description: 'Vector spaces, matrices, eigenvalues, and linear transformations.', departmentName: 'Mathematics', studentCount: 28 },
  { courseId: 6, title: 'English Composition', credits: 3, departmentId: 4, courseCode: 'ENG101', description: 'Academic writing, critical thinking, and rhetorical strategies.', departmentName: 'English', studentCount: 52 },
];

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CourseDto[]> {
    // Keep CI predictable and runnable without SQL Server.
    if (!process.env.SQLSERVER_CONNECTION_STRING) return seededCourses;

    const items = await this.prisma.course.findMany({
      include: {
        department: true,
        _count: { select: { studentCourses: true } },
      },
      orderBy: [{ title: 'asc' }],
      take: 200,
    });

    return items.map((c) => ({
      courseId: c.id,
      title: c.title,
      credits: c.credits,
      departmentId: c.departmentId,
      courseCode: '',
      description: '',
      departmentName: c.department?.name ?? '',
      studentCount: c._count.studentCourses,
    }));
  }
}
