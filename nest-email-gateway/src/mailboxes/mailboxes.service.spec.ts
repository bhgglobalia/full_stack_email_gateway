import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesService } from './mailboxes.service';

describe('MailboxesService', () => {
  let service: MailboxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailboxesService],
    }).compile();

    service = module.get<MailboxesService>(MailboxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
