import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

export enum Gender {
    Male = 'Male',
    Female = 'Female',
}

@Schema({ timestamps: true })
export class Profile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ trim: true })
    displayName: string;

    @Prop({ enum: Gender })
    gender: Gender;

    @Prop()
    birthday: Date;

    @Prop()
    horoscope: string;

    @Prop()
    zodiac: string;

    @Prop({ min: 0 })
    height: number;

    @Prop({ min: 0 })
    weight: number;

    @Prop({ type: [String], default: [] })
    interests: string[];

    @Prop()
    profileImage: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
