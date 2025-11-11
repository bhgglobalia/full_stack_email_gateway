import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should validate user with correct credentials', async () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('Password@123', 10),
      role: 'admin',
    };
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.validateUser(
      'test@example.com',
      'Password@123',
    );
    expect(result).toMatchObject({ email: 'test@example.com', role: 'admin' });
  });

  it('should fail validateUser with wrong password', async () => {
    const user = {
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('Password@123', 10),
    };
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.validateUser('test@example.com', 'WrongPass');
    expect(result).toBeNull();
  });

  it('should reject weak password in changePassword', async () => {
    const user = {
      id: '1',
      passwordHash: await bcrypt.hash('Password@123', 10),
    };
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.changePassword('1', 'Password@123', 'weak');
    expect(result.success).toBe(false);
  });

  it('should change password successfully', async () => {
    const user = {
      id: '1',
      passwordHash: await bcrypt.hash('Password@123', 10),
    };
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockResolvedValue(user);

    const result = await service.changePassword(
      '1',
      'Password@123',
      'StrongPass@2024',
    );
    expect(result.success).toBe(true);
  });
});
