import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema.js';
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { getHoroscope, getZodiac } from './utils/horoscope.util.js';

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(Profile.name)
        private readonly profileModel: Model<ProfileDocument>,
    ) { }

    async createProfile(
        userId: string,
        createProfileDto: CreateProfileDto,
        file?: Express.Multer.File,
    ): Promise<ProfileDocument> {
        // Check if profile already exists
        const existing = await this.profileModel.findOne({
            userId: new Types.ObjectId(userId),
        });
        if (existing) {
            throw new ConflictException('Profile already exists. Use updateProfile instead.');
        }

        const profileData: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
            ...createProfileDto,
        };

        // Auto-calculate horoscope and zodiac from birthday
        if (createProfileDto.birthday) {
            const birthday = new Date(createProfileDto.birthday);
            profileData.birthday = birthday;
            profileData.horoscope = getHoroscope(birthday);
            profileData.zodiac = getZodiac(birthday);
        }

        // Save uploaded file path
        if (file) {
            profileData.profileImage = `/uploads/profiles/${file.filename}`;
        }

        return this.profileModel.create(profileData);
    }

    async getProfile(userId: string): Promise<ProfileDocument> {
        const profile = await this.profileModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .populate('userId', 'email username');

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async updateProfile(
        userId: string,
        updateProfileDto: UpdateProfileDto,
        file?: Express.Multer.File,
    ): Promise<ProfileDocument> {
        const updateData: Record<string, unknown> = { ...updateProfileDto };

        // Recalculate horoscope and zodiac if birthday is being updated
        if (updateProfileDto.birthday) {
            const birthday = new Date(updateProfileDto.birthday);
            updateData.birthday = birthday;
            updateData.horoscope = getHoroscope(birthday);
            updateData.zodiac = getZodiac(birthday);
        }

        // Save uploaded file path
        if (file) {
            updateData.profileImage = `/uploads/profiles/${file.filename}`;
        }

        const profile = await this.profileModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $set: updateData },
            { new: true, runValidators: true },
        );

        if (!profile) {
            throw new NotFoundException(
                'Profile not found. Use createProfile first.',
            );
        }

        return profile;
    }
}
