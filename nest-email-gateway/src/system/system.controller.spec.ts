import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { Repository } from 'typeorm';

describe('SystemController', () => {
  let controller: SystemController;
  let mailboxRepo: Repository<Mailbox>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: getRepositoryToken(Mailbox),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
    mailboxRepo = module.get<Repository<Mailbox>>(getRepositoryToken(Mailbox));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
