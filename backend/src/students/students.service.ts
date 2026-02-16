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

const seededStudents: StudentDto[] = [
  { studentId: 1, firstName: 'Ada', lastName: 'Lovelace', enrollmentDate: '2024-01-15T00:00:00.000Z', email: 'ada.lovelace@contoso.edu', courseCount: 3 },
  { studentId: 2, firstName: 'Alan', lastName: 'Turing', enrollmentDate: '2024-02-20T00:00:00.000Z', email: 'alan.turing@contoso.edu', courseCount: 2 },
  { studentId: 3, firstName: 'Grace', lastName: 'Hopper', enrollmentDate: '2023-09-01T00:00:00.000Z', email: 'grace.hopper@contoso.edu', courseCount: 4 },
  { studentId: 4, firstName: 'John', lastName: 'von Neumann', enrollmentDate: '2023-11-10T00:00:00.000Z', email: 'john.von neumann@contoso.edu', courseCount: 2 },
  { studentId: 5, firstName: 'Marie', lastName: 'Curie', enrollmentDate: '2024-03-05T00:00:00.000Z', email: 'marie.curie@contoso.edu', courseCount: 1 },
];

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 20): Promise<PagedStudentsDto> {
    const take = Math.min(Math.max(pageSize, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;

    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      const items = seededStudents.slice(skip, skip + take);
      return {
        page: Math.max(page, 1),
        pageSize: take,
        totalCount: seededStudents.length,
        items,
      };
    }

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
    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      const found = seededStudents.find((s) => s.studentId === studentId);
      if (!found) throw new NotFoundException('Student not found');
      return found;
    }

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
    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      const newId = Math.max(...seededStudents.map((s) => s.studentId)) + 1;
      const created: StudentDto = {
        studentId: newId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        enrollmentDate: new Date(dto.enrollmentDate).toISOString(),
        email: `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}@contoso.edu`,
        courseCount: 0,
      };
      seededStudents.push(created);
      return created;
    }

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
    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      const idx = seededStudents.findIndex((s) => s.studentId === studentId);
      if (idx === -1) throw new NotFoundException('Student not found');
      const existing = seededStudents[idx];
      const updated: StudentDto = {
        ...existing,
        firstName: dto.firstName ?? existing.firstName,
        lastName: dto.lastName ?? existing.lastName,
        enrollmentDate: dto.enrollmentDate
          ? new Date(dto.enrollmentDate).toISOString()
          : existing.enrollmentDate,
      };
      seededStudents[idx] = updated;
      return updated;
    }

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
    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      const idx = seededStudents.findIndex((s) => s.studentId === studentId);
      if (idx === -1) throw new NotFoundException('Student not found');
      seededStudents.splice(idx, 1);
      return;
    }

    const existing = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!existing) throw new NotFoundException('Student not found');
    await this.prisma.student.delete({ where: { id: studentId } });
  }

  async search(name: string): Promise<StudentDto[]> {
    const q = name.trim();
    if (!q) return [];

    if (!process.env.SQLSERVER_CONNECTION_STRING) {
      return seededStudents.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q.toLowerCase()) ||
          s.lastName.toLowerCase().includes(q.toLowerCase()),
      );
    }

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
