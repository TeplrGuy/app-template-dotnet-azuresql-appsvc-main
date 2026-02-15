import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type CourseDto = {
  courseId: number;
  title: string;
  credits: number;
  departmentId?: number | null;
};

const seededCourses: CourseDto[] = [
  { courseId: 1, title: 'Calculus', credits: 4, departmentId: null },
  { courseId: 2, title: 'Chemistry', credits: 3, departmentId: null },
  { courseId: 3, title: 'Microeconomics', credits: 3, departmentId: null },
];

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CourseDto[]> {
    // Keep CI predictable and runnable without SQL Server.
    if (!process.env.SQLSERVER_CONNECTION_STRING) return seededCourses;

    const items = await this.prisma.course.findMany({
      orderBy: [{ title: 'asc' }],
      take: 200,
    });

    return items.map((c) => ({
      courseId: c.id,
      title: c.title,
      credits: c.credits,
      departmentId: c.departmentId,
    }));
  }
}
