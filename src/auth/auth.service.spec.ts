import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let mockUserModel: any;
    let mockJwtService: any;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@test.com',
        username: 'testuser',
        password: '$2b$10$hashedpassword',
        save: jest.fn(),
    };

    beforeEach(async () => {
        mockUserModel = {
            findOne: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
        };

        mockJwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getModelToken(User.name), useValue: mockUserModel },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@test.com',
            username: 'testuser',
            password: 'Test1234!',
            confirmPassword: 'Test1234!',
        };

        it('should register a new user successfully', async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockUserModel.create.mockResolvedValue(mockUser);
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

            const result = await service.register(registerDto);

            expect(result).toHaveProperty('access_token', 'mock-jwt-token');
            expect(result.user).toHaveProperty('email', 'test@test.com');
            expect(mockUserModel.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if email exists', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw ConflictException if username exists', async () => {
            mockUserModel.findOne
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce(mockUser); // username check

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('login', () => {
        const loginDto = {
            emailOrUsername: 'testuser',
            password: 'Test1234!',
        };

        it('should login successfully with valid credentials', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(loginDto);

            expect(result).toHaveProperty('access_token', 'mock-jwt-token');
            expect(result.user).toHaveProperty('username', 'testuser');
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('validateUser', () => {
        it('should return user without password', async () => {
            const selectMock = jest.fn().mockResolvedValue(mockUser);
            mockUserModel.findById.mockReturnValue({ select: selectMock });

            const result = await service.validateUser('507f1f77bcf86cd799439011');

            expect(result).toBeDefined();
            expect(selectMock).toHaveBeenCalledWith('-password');
        });

        it('should return null for non-existent user', async () => {
            const selectMock = jest.fn().mockResolvedValue(null);
            mockUserModel.findById.mockReturnValue({ select: selectMock });

            const result = await service.validateUser('nonexistent');

            expect(result).toBeNull();
        });
    });
});
