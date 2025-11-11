import { Injectable } from '@nestjs/common';
import { WsGateway } from '../ws/ws.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'src/entities/event.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private repo: Repository<Event>,
    private ws: WsGateway,
  ) {}
  async createNormalized(normalized: Partial<Event>) {
    const e = this.repo.create(normalized as any);
    const saved = await this.repo.save(e);

    this.ws.emit('email_event', saved);
    return saved;
  }

  async list(limit = 100, provider?: string, clientId?: string, date?: string) {
    let qb = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.mailbox', 'mailbox')
      .leftJoinAndSelect('mailbox.client', 'client')
      .orderBy('event.timestamp', 'DESC')
      .take(limit);
    if (provider) {
      qb = qb.andWhere('TRIM(LOWER(event.provider)) = TRIM(LOWER(:provider))', {
        provider,
      });
    }

    if (clientId) {
      qb = qb.andWhere('mailbox.clientId = :clientId', { clientId });
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      qb = qb.andWhere('event.timestamp >= :start AND event.timestamp < :end', {
        start,
        end,
      });
    }
    return qb.getMany();
  }
}
