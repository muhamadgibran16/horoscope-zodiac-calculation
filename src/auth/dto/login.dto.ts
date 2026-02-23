import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'johndoe@gmail.com',
        description: 'Email address or username',
    })
    @IsString()
    @IsNotEmpty({ message: 'Email or username is required' })
    emailOrUsername: string;

    @ApiProperty({ example: 'Test1234!', description: 'Account password' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
