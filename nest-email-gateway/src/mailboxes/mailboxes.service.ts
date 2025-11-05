import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Mailbox } from '../entities/mailbox.entity';
import { Client } from '../entities/client.entity';
import { WsGateway } from '../ws/ws.gateway';

@Injectable()
export class MailboxesService {
  constructor(
    @InjectRepository(Mailbox) private repo: Repository<Mailbox>,
    @InjectRepository(Client) private clients: Repository<Client>,
    private ws: WsGateway,
  ) {}

  async findAll() {
    const list = await this.repo.find({ order: { addedAt: 'DESC' }, relations: ['client'] });
    const now = new Date();
    return list.map((m) => {
      const status = !m.tokenExpiresAt || m.tokenExpiresAt > now ? 'active' : 'expired';
   
      return { ...m, status } as any;
    });
  }

  async countActive() {
    const now = new Date();

    return this.repo.count({
      where: [
        { tokenExpiresAt: IsNull() },
        { tokenExpiresAt: MoreThan(now) },
      ],
    });
  }

  async refreshTokenExpiry(id: number, extendSeconds = 3600) {
    const mb = await this.repo.findOne({ where: { id } });
    if (!mb) throw new Error('Mailbox not found');
    mb.tokenExpiresAt = new Date(Date.now() + extendSeconds * 1000);
    const saved = await this.repo.save(mb);
    const withClient = await this.repo.findOne({ where: { id: saved.id }, relations: ['client'] });
    this.ws.emit('mailboxUpdated', withClient);
    return withClient;
  }

  async saveTokens(
    email: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresInSecs?: number,
    clientId?: string,
  ) {

    const p = (provider || '').toLowerCase();
    const providerNorm = p.includes('google') || p.includes('gmail') ? 'google' : (p.includes('microsoft') || p.includes('outlook') ? 'outlook' : p);
 
    if (clientId) {
      const client = await this.clients.findOne({ where: { id: clientId } });
      if (client) {
        const clientProv = (client.emailProvider || '').toLowerCase();
        const clientProvNorm = clientProv.includes('google') || clientProv.includes('gmail') ? 'google' : (clientProv.includes('microsoft') || clientProv.includes('outlook') ? 'outlook' : clientProv);
        if (clientProvNorm && clientProvNorm !== providerNorm) {
          throw new Error(`Client is already connected to ${clientProvNorm}`);
        }
        if (!clientProvNorm) {
          client.emailProvider = providerNorm;
          await this.clients.save(client);
        }
      }
    }
    const where: any = { email };
    if (providerNorm) where.provider = providerNorm;
    if (clientId) where.clientId = clientId;
    const existing = await this.repo.findOne({ where });
    const expiry: Date | null = expiresInSecs
      ? new Date(Date.now() + (expiresInSecs as number) * 1000)
      : null;

    if (existing) {
      existing.accessToken = accessToken;
      existing.refreshToken = refreshToken ?? null;
      existing.tokenExpiresAt = expiry;
      const saved = await this.repo.save(existing);
      const withClient = await this.repo.findOne({ where: { id: saved.id }, relations: ['client'] });
      this.ws.emit('mailboxAdded', withClient);
      return withClient;
    }

    const mb = this.repo.create({
      email,
      provider: providerNorm,
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiresAt: expiry,
      clientId: clientId || undefined,
    });

    const savedNew = await this.repo.save(mb);
    const withClientNew = await this.repo.findOne({ where: { id: savedNew.id }, relations: ['client'] });
    this.ws.emit('mailboxAdded', withClientNew);
    return withClientNew;
  }
}
