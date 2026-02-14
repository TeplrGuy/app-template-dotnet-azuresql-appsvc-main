# Phase 1 Data Model: Contoso University (SQL-backed)

This data model reflects the existing Contoso University domain. The modernization keeps these entities and relationships, regardless of backend implementation language.

## Entities

### Student

- **StudentId** (int, PK)
- **FirstName** (string, required)
- **LastName** (string, required)
- **EnrollmentDate** (date/datetime, required)
- **Enrollments / StudentCourses**: 0..* (many-to-many with Course)

### Course

- **CourseId** (int, PK)
- **Title** (string, required)
- **Credits** (int, required)
- **DepartmentId** (int, FK → Department)
- **Department**: 1 (many courses per department)
- **Enrollments / StudentCourses**: 0..* (many-to-many with Student)
- **CourseAssignments**: 0..* (many-to-many with Instructor)

### Department

- **DepartmentId** (int, PK)
- **Name** (string, required)
- **Budget** (decimal/money, required)
- **StartDate** (date/datetime, required)
- **InstructorId** (int?, optional FK → Instructor) — administrator

### Instructor

- **InstructorId** (int, PK)
- **FirstName** (string, required)
- **LastName** (string, required)
- **HireDate** (date/datetime, required)
- **OfficeAssignment**: 0..1
- **CourseAssignments**: 0..* (many-to-many with Course)

### StudentCourse (Enrollment / Join)

Represents the many-to-many relationship between Students and Courses.

- **StudentId** (int, FK → Student)
- **CourseId** (int, FK → Course)
- **Grade** (enum/string/int depending on legacy schema; optional)
- Composite key: (StudentId, CourseId)

## Relationships Summary

- Student ↔ Course: many-to-many via StudentCourse
- Department → Course: one-to-many
- Instructor ↔ Course: many-to-many (via CourseAssignment in the typical Contoso model)
- Department → Instructor: optional one-to-one (administrator)

## Validation Rules (API-facing)

- Names: required, trimmed, reasonable max length (e.g., 50–100)
- Dates: required for Student/Instructor/Department start; cannot be default/min date
- Credits: positive integer within an expected range
- Budget: non-negative decimal

## Notes for Node/ORM Mapping

- Prefer explicit mapping to legacy table/column names (do not rename schema just to satisfy conventions).
- Keep join tables explicit (Prisma models or equivalent) to preserve the existing shape and allow grade fields.
