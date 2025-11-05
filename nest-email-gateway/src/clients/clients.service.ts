import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/entities/client.entity';
import { Repository } from 'typeorm';

import { WsGateway } from '../ws/ws.gateway';
import { Mailbox } from 'src/entities/mailbox.entity';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client) private repo: Repository<Client>,
        @InjectRepository(Mailbox) private mrepo: Repository<Mailbox>,
        private ws: WsGateway
    ) { }

    async findAll() {
        const clients = await this.repo.find({ order: { createdAt: "DESC" } });
        const now = new Date();

        const clientIds = clients.map(c => c.id);
        let mailboxesByClient = new Map<string, Mailbox[]>();
        if (clientIds.length) {
            const allMailboxes = await this.mrepo.find({ where: clientIds.map(id => ({ clientId: id })) as any });
        
            for (const mb of allMailboxes) {
                const list = mailboxesByClient.get(mb.clientId || '') || [];
                list.push(mb);
                if (mb.clientId) mailboxesByClient.set(mb.clientId, list);
            }
        }

        return clients.map((c) => {
            const mbs = mailboxesByClient.get(c.id) || [];
            const mailboxes = mbs.length;
            const hasActive = mbs.some(mb => !mb.tokenExpiresAt || mb.tokenExpiresAt > now);
            const status = hasActive ? 'active' : 'expired';
            return { ...c, mailboxes, status } as any;
        });
    }

    async create(payload: Partial<Client>) {
        const ent = this.repo.create(payload);
        const saved = await this.repo.save(ent);
        this.ws.emit('clientAdded', saved);
        return saved;
    }
}


