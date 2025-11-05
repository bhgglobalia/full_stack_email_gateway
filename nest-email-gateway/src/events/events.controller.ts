import { Body, Controller, Get, Post, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('events')
export class EventsController {
    constructor(private svc: EventsService) { }

    @Post()
    async create(@Body() payload: any, @Req() req: any) {
        const secret = process.env.EVENTS_SHARED_SECRET;
        if (secret) {
            const provided = req.headers['x-events-secret'] as string | undefined;
            if (!provided || provided !== secret) {
                throw new UnauthorizedException('Invalid events secret');
            }
        }
        const dirRaw = String(payload.direction || '').toLowerCase();
        const direction: 'inbound' | 'outbound' = dirRaw.includes('in') ? 'inbound' : 'outbound';
        const normalized = {
            mailboxId: payload.mailboxId,
            direction,
            status: payload.status,
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            provider: payload.provider || 'unknown',
            subject: payload.subject || null,
            sender: payload.sender || null,
            attachments: payload.attachments || [],
        };

        const saved = await this.svc.createNormalized(normalized);
        return { success: true, data: saved };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async all(
        @Query('limit') limit = '100',
        @Query('provider') provider?: string,
        @Query('clientId') clientId?: string,
        @Query('date') date?: string
    ) {
        const data = await this.svc.list(Number(limit), provider, clientId, date);
        return { success: true, data };
    }
}
