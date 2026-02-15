import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { InstructorsService } from '../src/instructors/instructors.service';

describe('Instructors (e2e)', () => {
  let app: INestApplication;

  const instructorsService: Partial<InstructorsService> = {
    list: jest.fn().mockResolvedValue([
      {
        instructorId: 1,
        firstName: 'Robert',
        lastName: 'Johnson',
        hireDate: '2015-08-15T00:00:00.000Z',
        department: 'Computer Science',
        email: 'robert.johnson@contoso.edu',
        office: 'Room 301',
      },
    ]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InstructorsService)
      .useValue(instructorsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/instructors returns 200 and array', async () => {
    await request(app.getHttpServer())
      .get('/api/instructors')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
