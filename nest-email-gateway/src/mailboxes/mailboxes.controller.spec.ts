import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesController } from './mailboxes.controller';

describe('MailboxesController', () => {
  let controller: MailboxesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailboxesController],
    }).compile();

    controller = module.get<MailboxesController>(MailboxesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
