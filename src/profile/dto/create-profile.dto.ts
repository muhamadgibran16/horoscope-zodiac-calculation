import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEnum,
    IsDateString,
    IsNumber,
    IsArray,
    IsOptional,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '../schemas/profile.schema.js';

export class CreateProfileDto {
    @ApiProperty({ example: 'John Doe', description: 'Display name' })
    @IsString()
    @IsOptional()
    displayName?: string;

    @ApiProperty({ example: 'Male', enum: Gender, description: 'Gender' })
    @IsEnum(Gender, { message: 'Gender must be Male or Female' })
    @IsOptional()
    gender?: Gender;

    @ApiProperty({
        example: '1995-08-28',
        description: 'Birthday in ISO format (YYYY-MM-DD)',
    })
    @IsDateString({}, { message: 'Birthday must be a valid date string (YYYY-MM-DD)' })
    @IsOptional()
    birthday?: string;

    @ApiPropertyOptional({
        example: 175,
        description: 'Height in centimeters',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    height?: number;

    @ApiPropertyOptional({
        example: 69,
        description: 'Weight in kilograms',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    weight?: number;

    @ApiPropertyOptional({
        example: ['Music', 'Basketball', 'Fitness'],
        description: 'User interests (send as JSON array string or multiple form fields)',
    })
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                return value.split(',').map((s: string) => s.trim());
            }
        }
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    interests?: string[];
}
