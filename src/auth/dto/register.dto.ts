import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    Matches,
} from 'class-validator';
import { Match } from '../decorators/match.decorator.js';

export class RegisterDto {
    @ApiProperty({ example: 'johndoe@gmail.com', description: 'User email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'johndoe123', description: 'Unique username' })
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Username must be at least 3 characters' })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    })
    username: string;

    @ApiProperty({ example: 'Test1234!', description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special character)' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
        message:
            'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
    })
    password: string;

    @ApiProperty({ example: 'Test1234!', description: 'Must match password' })
    @IsString()
    @IsNotEmpty()
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;
}
