/**
 * Database seeder — mirrors the old .NET DbInitializer.cs behavior.
 * Creates instructors, departments, courses, students, and enrollments
 * on first run (skips if data already exists).
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seed(prisma: PrismaClient): Promise<void> {
  // Check if data already exists
  const studentCount = await prisma.student.count();
  if (studentCount > 0) {
    console.log('Database already seeded — skipping');
    return;
  }

  console.log('Seeding database...');

  // 1. Create 1000 instructors
  const instructorData = Array.from({ length: 1000 }, () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    hireDate: faker.date.past({ years: 15 }),
  }));

  await prisma.instructor.createMany({ data: instructorData });
  const instructors = await prisma.instructor.findMany({
    select: { id: true },
  });
  console.log(`  Created ${instructors.length} instructors`);

  // 2. Create 4 departments
  const departmentDefs = [
    { name: 'English', budget: 350000 },
    { name: 'Mathematics', budget: 100000 },
    { name: 'Engineering', budget: 350000 },
    { name: 'Economics', budget: 100000 },
  ];

  for (const dept of departmentDefs) {
    const randomInstructor =
      instructors[Math.floor(Math.random() * instructors.length)];
    await prisma.department.create({
      data: {
        name: dept.name,
        budget: dept.budget,
        startDate: new Date('2007-09-01'),
        instructorId: randomInstructor.id,
      },
    });
  }

  const departments = await prisma.department.findMany();
  console.log(`  Created ${departments.length} departments`);

  // 3. Create 6 courses
  const courseDefs = [
    { title: 'Chemistry', credits: 3, dept: 'Engineering' },
    { title: 'Microeconomics', credits: 3, dept: 'Economics' },
    { title: 'Calculus', credits: 4, dept: 'Mathematics' },
    { title: 'Trigonometry', credits: 4, dept: 'Mathematics' },
    { title: 'Composition', credits: 3, dept: 'English' },
    { title: 'Literature', credits: 4, dept: 'English' },
  ];

  for (const course of courseDefs) {
    const dept = departments.find((d) => d.name === course.dept);
    await prisma.course.create({
      data: {
        title: course.title,
        credits: course.credits,
        departmentId: dept?.id,
      },
    });
  }

  const courses = await prisma.course.findMany({ select: { id: true } });
  console.log(`  Created ${courses.length} courses`);

  // 4. Create 10000 students (in batches of 1000)
  const batchSize = 1000;
  const totalStudents = 10000;
  for (let i = 0; i < totalStudents; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, totalStudents - i) },
      () => ({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        enrollmentDate: faker.date.past({ years: 4 }),
      }),
    );
    await prisma.student.createMany({ data: batch });
  }

  const students = await prisma.student.findMany({ select: { id: true } });
  console.log(`  Created ${students.length} students`);

  // 5. Create enrollments (1 random course per student, in batches)
  const enrollmentBatchSize = 1000;
  for (let i = 0; i < students.length; i += enrollmentBatchSize) {
    const batch = students
      .slice(i, i + enrollmentBatchSize)
      .map((s) => ({
        studentId: s.id,
        courseId: courses[Math.floor(Math.random() * courses.length)].id,
      }));
    await prisma.studentCourse.createMany({
      data: batch,
    });
  }

  console.log(`  Created student-course enrollments`);
  console.log('Database seeding complete!');
}
