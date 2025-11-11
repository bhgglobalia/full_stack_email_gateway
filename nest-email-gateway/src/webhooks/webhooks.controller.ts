import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { WorkerService } from '../worker/worker.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mailbox } from '../entities/mailbox.entity';

@Controller('webhook')
export class WebhooksController {
  constructor(
    private worker: WorkerService,
    @InjectRepository(Mailbox) private mailboxRepo: Repository<Mailbox>,
  ) {}

  @Post('gmail')
  async gmail(@Body() body: any, @Req() req: any) {
    const secret = process.env.EVENTS_SHARED_SECRET;
    if (secret) {
      const provided = req.headers['x-events-secret'] as string | undefined;
      if (!provided || provided !== secret)
        throw new UnauthorizedException('Invalid secret');
    }
    const mailboxId =
      Number(body.mailboxId || body.resourceId || body.subscription || 0) ||
      undefined;
    if (!mailboxId) return { success: false, message: 'mailboxId is required' };

    const mailbox = await this.mailboxRepo.findOne({
      where: { id: mailboxId },
    });
    if (!mailbox) return { success: false, message: 'mailboxId not found' };
    await this.worker.enqueueInbound({
      mailboxId,
      provider: 'google',
      subject: body.subject,
      attachments: body.attachments,
    });
    return { success: true };
  }

  @Post('microsoft')
  async microsoft(@Body() body: any, @Req() req: any) {
    const secret = process.env.EVENTS_SHARED_SECRET;
    if (secret) {
      const provided = req.headers['x-events-secret'] as string | undefined;
      if (!provided || provided !== secret)
        throw new UnauthorizedException('Invalid secret');
    }
    const mailboxId =
      Number(body.mailboxId || body.resourceId || body.subscriptionId || 0) ||
      undefined;
    if (!mailboxId) return { success: false, message: 'mailboxId is required' };

    const mailbox = await this.mailboxRepo.findOne({
      where: { id: mailboxId },
    });
    if (!mailbox) return { success: false, message: 'mailboxId not found' };
    await this.worker.enqueueInbound({
      mailboxId,
      provider: 'outlook',
      subject: body.subject,
      attachments: body.attachments,
    });
    return { success: true };
  }
}
