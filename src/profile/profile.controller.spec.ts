import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

describe('ProfileController', () => {
    let controller: ProfileController;
    let mockProfileService: any;

    const mockUser = { _id: '507f1f77bcf86cd799439011' };
    const mockProfile = {
        _id: '507f1f77bcf86cd799439022',
        userId: '507f1f77bcf86cd799439011',
        displayName: 'John Doe',
        horoscope: 'Virgo',
        zodiac: 'Pig',
    };

    beforeEach(async () => {
        mockProfileService = {
            createProfile: jest.fn().mockResolvedValue(mockProfile),
            getProfile: jest.fn().mockResolvedValue(mockProfile),
            updateProfile: jest.fn().mockResolvedValue(mockProfile),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfileController],
            providers: [
                { provide: ProfileService, useValue: mockProfileService },
            ],
        }).compile();

        controller = module.get<ProfileController>(ProfileController);
    });

    describe('createProfile', () => {
        it('should create a profile without file', async () => {
            const dto = { displayName: 'John Doe', birthday: '1995-08-28' };
            const result = await controller.createProfile(mockUser, dto, undefined);

            expect(result).toEqual(mockProfile);
            expect(mockProfileService.createProfile).toHaveBeenCalledWith(
                mockUser._id,
                dto,
                undefined,
            );
        });

        it('should create a profile with file upload', async () => {
            const dto = { displayName: 'John Doe', birthday: '1995-08-28' };
            const mockFile = {
                fieldname: 'profileImage',
                originalname: 'photo.jpg',
                filename: 'profile-123.jpg',
                path: 'uploads/profiles/profile-123.jpg',
            } as Express.Multer.File;

            const result = await controller.createProfile(mockUser, dto, mockFile);

            expect(result).toEqual(mockProfile);
            expect(mockProfileService.createProfile).toHaveBeenCalledWith(
                mockUser._id,
                dto,
                mockFile,
            );
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            const result = await controller.getProfile(mockUser);

            expect(result).toEqual(mockProfile);
            expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockUser._id);
        });
    });

    describe('updateProfile', () => {
        it('should update a profile without file', async () => {
            const dto = { displayName: 'New Name' };
            const result = await controller.updateProfile(mockUser, dto, undefined);

            expect(result).toEqual(mockProfile);
            expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
                mockUser._id,
                dto,
                undefined,
            );
        });

        it('should update a profile with file upload', async () => {
            const dto = { displayName: 'New Name' };
            const mockFile = {
                fieldname: 'profileImage',
                originalname: 'new-photo.png',
                filename: 'profile-456.png',
                path: 'uploads/profiles/profile-456.png',
            } as Express.Multer.File;

            const result = await controller.updateProfile(mockUser, dto, mockFile);

            expect(result).toEqual(mockProfile);
            expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
                mockUser._id,
                dto,
                mockFile,
            );
        });
    });
});
