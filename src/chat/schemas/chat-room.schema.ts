import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true })
export class ChatRoom {
    @Prop({
        type: [{ type: Types.ObjectId, ref: 'User' }],
        validate: {
            validator: (v: Types.ObjectId[]) => v.length === 2,
            message: 'A chat room must have exactly 2 participants',
        },
        required: true,
    })
    participants: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessage: Types.ObjectId;

    @Prop({ default: 0 })
    unreadCount: number;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

// Compound index for finding rooms by participants (sorted pair for consistency)
ChatRoomSchema.index({ participants: 1 }, { unique: true });
