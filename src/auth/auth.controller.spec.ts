import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
    let controller: AuthController;
    let mockAuthService: any;

    const mockAuthResponse = {
        access_token: 'mock-jwt-token',
        user: {
            id: '507f1f77bcf86cd799439011',
            email: 'test@test.com',
            username: 'testuser',
        },
    };

    beforeEach(async () => {
        mockAuthService = {
            register: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const dto = {
                email: 'test@test.com',
                username: 'testuser',
                password: 'Test1234!',
                confirmPassword: 'Test1234!',
            };

            const result = await controller.register(dto);

            expect(result).toEqual(mockAuthResponse);
            expect(mockAuthService.register).toHaveBeenCalledWith(dto);
        });
    });

    describe('login', () => {
        it('should login a user', async () => {
            const dto = {
                emailOrUsername: 'testuser',
                password: 'Test1234!',
            };

            const result = await controller.login(dto);

            expect(result).toEqual(mockAuthResponse);
            expect(mockAuthService.login).toHaveBeenCalledWith(dto);
        });
    });
});
