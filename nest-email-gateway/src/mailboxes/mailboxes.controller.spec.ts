import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesController } from './mailboxes.controller';
import { MailboxesService } from './mailboxes.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

describe('MailboxesController', () => {
  let controller: MailboxesController;
  let service: MailboxesService;

  beforeEach(async () => {
    const mockValues = {
      PUBLIC_URL: 'http://localhost:3000',
      FRONTEND_ORIGIN: 'http://localhost:3001',
      GMAIL_CLIENT_ID: 'G123',
      MS_CLIENT_ID: 'M123',
    } as const;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailboxesController],
      providers: [
        {
          provide: MailboxesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([{ id: 1 }]),
            refreshTokenExpiry: jest.fn().mockResolvedValue({ id: 1 }),
            countActive: jest.fn().mockResolvedValue(5),
            saveTokens: jest.fn().mockResolvedValue({ id: 99 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof mockValues) => mockValues[key]),
          },
        },
        // 👇 Mock the CACHE_MANAGER and Reflector (needed for CacheInterceptor)
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MailboxesController>(MailboxesController);
    service = module.get<MailboxesService>(MailboxesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET all should return list', async () => {
    const result = await controller.all('0', '10');
    expect(result.data).toEqual([{ id: 1 }]);
  });

  it('PATCH refresh should call service', async () => {
    const result = await controller.refresh('1');
    expect(service.refreshTokenExpiry).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('GET active count should return count', async () => {
    const result = await controller.countActive();
    expect(result.count).toBe(5);
  });

  it('GET oauth/google should return redirect URL', async () => {
    const result = await controller.oauthRedirect('google', {
      clientId: 'c1',
      email: 'x',
    });
    expect(result.redirectUrl).toContain('accounts.google.com');
  });

  it('GET oauth/microsoft should return redirect URL', async () => {
    const result = await controller.oauthRedirect('microsoft', {
      clientId: 'c1',
      email: 'x',
    });
    expect(result.redirectUrl).toContain('login.microsoftonline.com');
  });
});
