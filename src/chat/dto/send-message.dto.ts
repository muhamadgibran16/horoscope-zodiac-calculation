import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({
        example: '65a1b2c3d4e5f6a7b8c9d0e1',
        description: 'Receiver user ID (MongoDB ObjectId)',
    })
    @IsMongoId({ message: 'receiverId must be a valid MongoDB ObjectId' })
    receiverId: string;

    @ApiProperty({
        example: 'Hello, how are you?',
        description: 'Message content',
    })
    @IsString()
    @MinLength(1, { message: 'Message cannot be empty' })
    content: string;
}
