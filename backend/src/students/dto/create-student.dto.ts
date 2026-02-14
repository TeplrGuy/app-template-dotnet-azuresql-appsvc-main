import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  @IsDateString()
  enrollmentDate!: string;
}
