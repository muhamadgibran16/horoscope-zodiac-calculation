import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfileService } from './profile.service.js';
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

const multerOptions = {
    storage: diskStorage({
        destination: './uploads/profiles',
        filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `profile-${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Post('/')
    @ApiOperation({ summary: 'Create user profile' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Profile data with optional image upload',
        schema: {
            type: 'object',
            properties: {
                displayName: { type: 'string', example: 'John Doe' },
                gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
                birthday: { type: 'string', example: '1995-08-28' },
                height: { type: 'number', example: 175 },
                weight: { type: 'number', example: 69 },
                interests: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Music', 'Basketball'],
                },
                profileImage: { type: 'string', format: 'binary', description: 'Profile image file' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Profile created. Horoscope and zodiac are auto-calculated from birthday.',
    })
    @ApiResponse({ status: 409, description: 'Profile already exists' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseInterceptors(FileInterceptor('profileImage', multerOptions))
    async createProfile(
        @CurrentUser() user: any,
        @Body() createProfileDto: CreateProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.profileService.createProfile(user._id, createProfileDto, file);
    }

    @Get('/')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Returns user profile with horoscope and zodiac' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser() user: any) {
        return this.profileService.getProfile(user._id);
    }

    @Put('/')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Profile fields to update with optional image upload',
        schema: {
            type: 'object',
            properties: {
                displayName: { type: 'string', example: 'John Doe' },
                gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
                birthday: { type: 'string', example: '1995-08-28' },
                height: { type: 'number', example: 175 },
                weight: { type: 'number', example: 69 },
                interests: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Music', 'Basketball'],
                },
                profileImage: { type: 'string', format: 'binary', description: 'Profile image file' },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Profile updated. Horoscope and zodiac recalculated if birthday changed.',
    })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseInterceptors(FileInterceptor('profileImage', multerOptions))
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.profileService.updateProfile(user._id, updateProfileDto, file);
    }
}
