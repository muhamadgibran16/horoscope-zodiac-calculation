import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ViewMessagesDto } from './dto/view-messages.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('send')
    @ApiOperation({
        summary: 'Send a message to another user',
        description:
            'Sends a message to the specified receiver. The message is saved to the database and published to RabbitMQ for real-time notification via Socket.IO.',
    })
    @ApiBody({ type: SendMessageDto })
    @ApiResponse({ status: 201, description: 'Message sent successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async sendMessage(
        @CurrentUser() user: any,
        @Body() sendMessageDto: SendMessageDto,
    ) {
        return this.chatService.sendMessage(user._id, sendMessageDto);
    }

    @Get('view')
    @ApiOperation({
        summary: 'View messages with another user',
        description:
            'Retrieves paginated messages between the current user and the specified user. Automatically marks unread messages as read.',
    })
    @ApiQuery({ name: 'userId', description: 'Other user ID to view conversation with' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Messages per page (default: 50, max: 100)' })
    @ApiResponse({ status: 200, description: 'Returns paginated messages' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async viewMessages(
        @CurrentUser() user: any,
        @Query() viewMessagesDto: ViewMessagesDto,
    ) {
        return this.chatService.viewMessages(user._id, viewMessagesDto);
    }

    @Get('rooms')
    @ApiOperation({
        summary: 'Get all chat rooms for the current user',
        description:
            'Returns a list of conversations ordered by the most recent message.',
    })
    @ApiResponse({ status: 200, description: 'Returns list of chat rooms' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getChatRooms(@CurrentUser() user: any) {
        return this.chatService.getChatRooms(user._id);
    }
}
