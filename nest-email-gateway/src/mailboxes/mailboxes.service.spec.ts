import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesService } from './mailboxes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Mailbox } from '../entities/mailbox.entity';
import { Client } from '../entities/client.entity';
import { WsGateway } from '../ws/ws.gateway';
import { Repository } from 'typeorm';

describe('MailboxesService', () => {
  let service: MailboxesService;
  let repo: Repository<Mailbox>;
  let clientRepo: Repository<Client>;
  let wsGateway: WsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailboxesService,
        {
          provide: getRepositoryToken(Mailbox),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: WsGateway,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MailboxesService);
    repo = module.get(getRepositoryToken(Mailbox));
    clientRepo = module.get(getRepositoryToken(Client));
    wsGateway = module.get(WsGateway);
  });

  it('should create new mailbox if not exists', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockReturnValue({
      id: 10,
      email: 'new@test.com',
    });
    (repo.save as jest.Mock).mockResolvedValue({
      id: 10,
      email: 'new@test.com',
    });
    (repo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 10, email: 'new@test.com' });
    (wsGateway.emit as jest.Mock).mockImplementation(() => {});

    const result = await service.saveTokens(
      'new@test.com',
      'google',
      'a',
      'b',
      1000,
    );
    expect(result?.id).toBe(10);
    expect(wsGateway.emit).toHaveBeenCalledWith(
      'mailboxAdded',
      expect.anything(),
    );
  });
});
