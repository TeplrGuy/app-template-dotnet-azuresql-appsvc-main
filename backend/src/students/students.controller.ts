import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paged students' })
  async list(@Query() query: PaginationQueryDto) {
    return this.students.list(query.page, query.pageSize);
  }

  @Get('search')
  @ApiQuery({ name: 'name', required: true })
  @ApiOkResponse({ description: 'Matching students' })
  async search(@Query('name') name: string) {
    return this.students.search(name);
  }

  @Get(':studentId')
  @ApiOkResponse({ description: 'Student' })
  async get(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.students.get(studentId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Created student' })
  async create(@Body() dto: CreateStudentDto) {
    return this.students.create(dto);
  }

  @Put(':studentId')
  @ApiOkResponse({ description: 'Updated student' })
  async update(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.students.update(studentId, dto);
  }

  @Delete(':studentId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted' })
  async remove(@Param('studentId', ParseIntPipe) studentId: number) {
    await this.students.remove(studentId);
  }
}
