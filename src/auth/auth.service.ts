import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
}

export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        username: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        const { email, username, password } = registerDto;

        // Check for existing email
        const existingEmail = await this.userModel.findOne({
            email: email.toLowerCase(),
        });
        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        // Check for existing username
        const existingUsername = await this.userModel.findOne({
            username: username.toLowerCase(),
        });
        if (existingUsername) {
            throw new ConflictException('Username already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await this.userModel.create({
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password: hashedPassword,
        });

        return this.generateToken(user);
    }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const { emailOrUsername, password } = loginDto;
        const query = emailOrUsername.toLowerCase();

        // Find by email or username
        const user = await this.userModel.findOne({
            $or: [{ email: query }, { username: query }],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateToken(user);
    }

    async validateUser(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).select('-password');
    }

    private generateToken(user: UserDocument): AuthResponse {
        const payload: JwtPayload = {
            sub: (user._id as any).toString(),
            username: user.username,
            email: user.email,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: (user._id as any).toString(),
                email: user.email,
                username: user.username,
            },
        };
    }
}
