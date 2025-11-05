import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwt: JwtService,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const pwd = await bcrypt.hash('password', 10);
      await this.userRepo.save({
        email: 'admin@example.com',
        passwordHash: pwd,
        role: 'admin',
      });
   
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);
    return { access_token: token, token, accessToken: token };
  }
}
