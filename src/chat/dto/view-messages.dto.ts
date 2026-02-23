import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ViewMessagesDto {
    @ApiProperty({
        example: '65a1b2c3d4e5f6a7b8c9d0e1',
        description: 'Other user ID to view conversation with',
    })
    @IsMongoId({ message: 'userId must be a valid MongoDB ObjectId' })
    userId: string;

    @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        example: 50,
        description: 'Messages per page (default: 50, max: 100)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 50;
}
