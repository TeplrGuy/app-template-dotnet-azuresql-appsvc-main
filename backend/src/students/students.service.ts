import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

export type StudentDto = {
  studentId: number;
  firstName: string;
  lastName: string;
  enrollmentDate: string;
  email: string;
  courseCount: number;
};

export type PagedStudentsDto = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: StudentDto[];
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 20): Promise<PagedStudentsDto> {
    const take = Math.min(Math.max(pageSize, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.student.count(),
      this.prisma.student.findMany({
        include: { _count: { select: { studentCourses: true } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take,
      }),
    ]);

    return {
      page: Math.max(page, 1),
      pageSize: take,
      totalCount,
      items: items.map((s) => ({
        studentId: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        enrollmentDate: s.enrollmentDate.toISOString(),
        email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`,
        courseCount: s._count.studentCourses,
      })),
    };
  }

  async get(studentId: number): Promise<StudentDto> {
    const s = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { _count: { select: { studentCourses: true } } },
    });
    if (!s) throw new NotFoundException('Student not found');
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      enrollmentDate: s.enrollmentDate.toISOString(),
      email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`,
      courseCount: s._count.studentCourses,
    };
  }

  async create(dto: CreateStudentDto): Promise<StudentDto> {
    const s = await this.prisma.student.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        enrollmentDate: new Date(dto.enrollmentDate),
      },
    });

    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      enrollmentDate: s.enrollmentDate.toISOString(),
      email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`,
      courseCount: 0,
    };
  }

  async update(studentId: number, dto: UpdateStudentDto): Promise<StudentDto> {
    const existing = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!existing) throw new NotFoundException('Student not found');

    const s = await this.prisma.student.update({
      where: { id: studentId },
      include: { _count: { select: { studentCourses: true } } },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        enrollmentDate: dto.enrollmentDate
          ? new Date(dto.enrollmentDate)
          : undefined,
      },
    });

    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      enrollmentDate: s.enrollmentDate.toISOString(),
      email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`,
      courseCount: s._count.studentCourses,
    };
  }

  async remove(studentId: number): Promise<void> {
    const existing = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!existing) throw new NotFoundException('Student not found');
    await this.prisma.student.delete({ where: { id: studentId } });
  }

  async search(name: string): Promise<StudentDto[]> {
    const q = name.trim();
    if (!q) return [];

    const items = await this.prisma.student.findMany({
      where: {
        OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }],
      },
      include: { _count: { select: { studentCourses: true } } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 50,
    });

    return items.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      enrollmentDate: s.enrollmentDate.toISOString(),
      email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@contoso.edu`,
      courseCount: s._count.studentCourses,
    }));
  }
}
