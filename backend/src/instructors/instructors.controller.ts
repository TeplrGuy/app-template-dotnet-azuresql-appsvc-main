import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { InstructorsService } from './instructors.service';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructors: InstructorsService) {}

  @Get()
  @ApiOkResponse({ description: 'Instructors list' })
  async list() {
    return this.instructors.list();
  }
}
