import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ProfileService } from './profile.service.js';
import { Profile } from './schemas/profile.schema.js';

describe('ProfileService', () => {
    let service: ProfileService;
    let mockProfileModel: any;

    const mockProfile = {
        _id: '507f1f77bcf86cd799439022',
        userId: '507f1f77bcf86cd799439011',
        displayName: 'John Doe',
        gender: 'Male',
        birthday: new Date('1995-08-28'),
        horoscope: 'Virgo',
        zodiac: 'Pig',
        height: 175,
        weight: 69,
        interests: ['Music', 'Basketball'],
        profileImage: null,
    };

    beforeEach(async () => {
        mockProfileModel = {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                { provide: getModelToken(Profile.name), useValue: mockProfileModel },
            ],
        }).compile();

        service = module.get<ProfileService>(ProfileService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createProfile', () => {
        it('should create a profile with auto-calculated horoscope and zodiac', async () => {
            mockProfileModel.findOne.mockResolvedValue(null);
            mockProfileModel.create.mockResolvedValue(mockProfile);

            const result = await service.createProfile('507f1f77bcf86cd799439011', {
                displayName: 'John Doe',
                gender: 'Male' as any,
                birthday: '1995-08-28',
                height: 175,
                weight: 69,
            });

            expect(result).toEqual(mockProfile);
            expect(mockProfileModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    horoscope: 'Virgo',
                    zodiac: 'Pig',
                }),
            );
        });

        it('should create a profile with file upload', async () => {
            mockProfileModel.findOne.mockResolvedValue(null);
            mockProfileModel.create.mockResolvedValue({
                ...mockProfile,
                profileImage: '/uploads/profiles/profile-123.jpg',
            });

            const mockFile = {
                fieldname: 'profileImage',
                originalname: 'photo.jpg',
                filename: 'profile-123.jpg',
                path: 'uploads/profiles/profile-123.jpg',
            } as Express.Multer.File;

            const result = await service.createProfile(
                '507f1f77bcf86cd799439011',
                { displayName: 'John Doe', birthday: '1995-08-28' },
                mockFile,
            );

            expect(result.profileImage).toBe('/uploads/profiles/profile-123.jpg');
            expect(mockProfileModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    profileImage: '/uploads/profiles/profile-123.jpg',
                }),
            );
        });

        it('should throw ConflictException if profile exists', async () => {
            mockProfileModel.findOne.mockResolvedValue(mockProfile);

            await expect(
                service.createProfile('507f1f77bcf86cd799439011', {
                    displayName: 'Test',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('getProfile', () => {
        it('should return a profile', async () => {
            const populateMock = jest.fn().mockResolvedValue(mockProfile);
            mockProfileModel.findOne.mockReturnValue({ populate: populateMock });

            const result = await service.getProfile('507f1f77bcf86cd799439011');

            expect(result).toEqual(mockProfile);
        });

        it('should throw NotFoundException if profile not found', async () => {
            const populateMock = jest.fn().mockResolvedValue(null);
            mockProfileModel.findOne.mockReturnValue({ populate: populateMock });

            await expect(
                service.getProfile('507f1f77bcf86cd799439011'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        it('should update profile and recalculate horoscope/zodiac', async () => {
            mockProfileModel.findOneAndUpdate.mockResolvedValue({
                ...mockProfile,
                birthday: new Date('1990-03-25'),
                horoscope: 'Aries',
                zodiac: 'Horse',
            });

            const result = await service.updateProfile('507f1f77bcf86cd799439011', {
                birthday: '1990-03-25',
            });

            expect(result.horoscope).toBe('Aries');
            expect(result.zodiac).toBe('Horse');
        });

        it('should update profile with file upload', async () => {
            mockProfileModel.findOneAndUpdate.mockResolvedValue({
                ...mockProfile,
                profileImage: '/uploads/profiles/profile-456.png',
            });

            const mockFile = {
                fieldname: 'profileImage',
                originalname: 'new-photo.png',
                filename: 'profile-456.png',
                path: 'uploads/profiles/profile-456.png',
            } as Express.Multer.File;

            const result = await service.updateProfile(
                '507f1f77bcf86cd799439011',
                { displayName: 'Updated' },
                mockFile,
            );

            expect(result.profileImage).toBe('/uploads/profiles/profile-456.png');
            expect(mockProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.anything(),
                {
                    $set: expect.objectContaining({
                        profileImage: '/uploads/profiles/profile-456.png',
                    }),
                },
                expect.anything(),
            );
        });

        it('should throw NotFoundException if profile not found', async () => {
            mockProfileModel.findOneAndUpdate.mockResolvedValue(null);

            await expect(
                service.updateProfile('507f1f77bcf86cd799439011', {
                    displayName: 'New Name',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
