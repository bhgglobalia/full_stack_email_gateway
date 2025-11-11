import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { Repository } from 'typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { EventsService } from 'src/events/events.service';
import Redis from 'ioredis';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('MailService', () => {
  let service: MailService;
  let repo: Repository<Mailbox>;
  let eventsService: EventsService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getRepositoryToken(Mailbox),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            createNormalized: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: new Redis(),
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    repo = module.get(getRepositoryToken(Mailbox));
    eventsService = module.get<EventsService>(EventsService);
    redis = module.get<Redis>('REDIS_CLIENT');

    service['sendQueue'] = {
      add: jest.fn().mockResolvedValue({ id: '123' }),
      getJobs: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    } as any;
  });

  afterEach(() => jest.restoreAllMocks());

  it('should enqueue send job', async () => {
    const result = await service.enqueueSend({
      mailboxId: '1',
      subject: 'Test',
    } as any);
    expect(result.id).toBe('123');
  });

  it('should processSend and mark ok if mailbox valid ', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      provider: 'gmail',
      totalExpiresAt: new Date(Date.now() + 100000),
      email: 'test@gmail.com',
    });
    await service['processSend']({
      mailboxId: '1',
      subject: 'Hello',
    } as any);
    expect(eventsService.createNormalized).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok' }),
    );
  });

  it('should mark error if mailbox expired', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      tokenExpiresAt: new Date(Date.now() - 1000), // expired
      provider: 'gmail',
    });

    await service['processSend']({
      mailboxId: '1',
      subject: 'Fail',
    } as any);

    expect(eventsService.createNormalized).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });
});
