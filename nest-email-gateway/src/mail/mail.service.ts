import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';


const SEND_QUEUE: any[] = [];


@Injectable()
export class MailService {
    constructor(
        @InjectRepository(Mailbox) private repo: Repository<Mailbox>,
        private events: EventsService
    ) { }

    async enqueueSend(payload: any) {
        
        const job = { id: `job_${Date.now()}`, payload, createdAt: new Date() };
        SEND_QUEUE.push(job);

        setTimeout(async () => {
            try {
          
            
                const mailbox = await this.repo.findOne({ where: { id: job.payload.mailboxId } });
                const now = new Date();

                const isExpired = !mailbox || (mailbox.tokenExpiresAt && mailbox.tokenExpiresAt < now);
                if (isExpired) {
                    const failPayload: any = {
                        mailboxId: job.payload.mailboxId,
                        direction: 'outbound',
                        status: 'error',
                        timestamp: now,
                        provider: mailbox?.provider || 'unknown',
                        subject: job.payload.subject,
                        sender: job.payload.from || mailbox?.email,
                        attachments: job.payload.attachment ? [job.payload.attachment] : [],
                    };
                    if (mailbox) failPayload.mailbox = mailbox;
                    await this.events.createNormalized(failPayload);
                    return;
                }
              
              
              
                const eventPayload: any = {
                    mailboxId: job.payload.mailboxId,
                    direction: 'outbound',
                    status: 'ok',
                    timestamp: new Date(),
                    provider: mailbox?.provider || 'unknown',
                    subject: job.payload.subject,
                    sender: job.payload.from || mailbox?.email,
                    attachments: job.payload.attachment ? [job.payload.attachment] : [],
                };
                if (mailbox) eventPayload.mailbox = mailbox;
                await this.events.createNormalized(eventPayload);
            } catch (err) {
                const mailbox = await this.repo.findOne({ where: { id: job.payload.mailboxId } });
                const failPayload: any = {
                    mailboxId: job.payload.mailboxId,
                    direction: 'outbound',
                    status: 'error',
                    timestamp: new Date(),
                    provider: mailbox?.provider || 'unknown',
                    subject: job.payload.subject,
                    sender: job.payload.from || mailbox?.email,
                    attachments: job.payload.attachment ? [job.payload.attachment] : [],
                };
                if (mailbox) failPayload.mailbox = mailbox;
                await this.events.createNormalized(failPayload);
            }
        }, 1000);
        return job;
    }

    async listQueue() {
        return SEND_QUEUE.slice().reverse();
    }
}
