import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      return {
        totalStudents: 156,
        activeCourses: 42,
        facultyMembers: 28,
        totalEnrollments: 1250,
      };
    }

    const [totalStudents, activeCourses, facultyMembers, totalEnrollments] =
      await Promise.all([
        this.prisma.student.count(),
        this.prisma.course.count(),
        this.prisma.instructor.count(),
        this.prisma.studentCourse.count(),
      ]);

    return { totalStudents, activeCourses, facultyMembers, totalEnrollments };
  }
}
