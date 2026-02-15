import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type InstructorDto = {
  instructorId: number;
  firstName: string;
  lastName: string;
  hireDate: string;
  department: string;
  email: string;
  office: string;
};

const seededInstructors: InstructorDto[] = [
  { instructorId: 1, firstName: 'Robert', lastName: 'Johnson', hireDate: '2015-08-15T00:00:00.000Z', department: 'Computer Science', email: 'robert.johnson@contoso.edu', office: 'Room 301' },
  { instructorId: 2, firstName: 'Sarah', lastName: 'Williams', hireDate: '2018-01-20T00:00:00.000Z', department: 'Mathematics', email: 'sarah.williams@contoso.edu', office: 'Room 205' },
  { instructorId: 3, firstName: 'Michael', lastName: 'Chen', hireDate: '2016-09-01T00:00:00.000Z', department: 'Physics', email: 'michael.chen@contoso.edu', office: 'Room 412' },
  { instructorId: 4, firstName: 'Emily', lastName: 'Davis', hireDate: '2019-03-10T00:00:00.000Z', department: 'English', email: 'emily.davis@contoso.edu', office: 'Room 108' },
  { instructorId: 5, firstName: 'James', lastName: 'Wilson', hireDate: '2017-06-22T00:00:00.000Z', department: 'Computer Science', email: 'james.wilson@contoso.edu', office: 'Room 303' },
  { instructorId: 6, firstName: 'Lisa', lastName: 'Anderson', hireDate: '2020-01-15T00:00:00.000Z', department: 'Mathematics', email: 'lisa.anderson@contoso.edu', office: 'Room 207' },
];

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<InstructorDto[]> {
    if (!process.env.SQLSERVER_CONNECTION_STRING) return seededInstructors;

    const items = await this.prisma.instructor.findMany({
      include: { departments: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 200,
    });

    return items.map((i) => ({
      instructorId: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      hireDate: i.hireDate.toISOString(),
      department: i.departments.length > 0 ? i.departments[0].name : '',
      email: `${i.firstName.toLowerCase()}.${i.lastName.toLowerCase()}@contoso.edu`,
      office: '',
    }));
  }
}
