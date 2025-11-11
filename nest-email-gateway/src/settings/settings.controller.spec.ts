import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  beforeEach(async () => {
    const mockService = {
      getMaskedKeys: jest.fn().mockReturnValue({ jwtSecret: '***' }),
      getWebhookUrls: jest.fn().mockReturnValue({ gmail: 'url' }),
      getWorkerHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
      getTokenExpiryInfo: jest.fn().mockResolvedValue([{ id: 1 }]),
      workerHealth: jest.fn().mockResolvedValue({ reachable: true }),
      tokenExpiryInfo: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockService, // ✅ provide the mock
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return masked keys', () => {
    const result = controller.getMaskedKeys();
    expect(result.jwtSecret).toBe('***');
  });

  it('should return webhook URLs', () => {
    const result = controller.getWebhookUrls();
    expect(result.gmail).toBe('url');
  });

  it('should return worker health', async () => {
    const result = await controller.getWorkerHealth();
    expect(result.status).toBe('ok');
  });

  it('should call all services and return success object', async () => {
    const result = await controller.all();
    expect(result.success).toBe(true);
    expect(result.data.apiKeys.jwtSecret).toBe('***');
  });

  it('should return ping response', () => {
    const result = controller.ping();
    expect(result.success).toBe(true);
  });

  it('should return ping worker', async () => {
    const result = await controller.pingWorker();
    expect(result.data.reachable).toBe(true);
  });
});
