import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    const token = await this.authService.login(user);
    return { success: true, ...token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return { success: true, user: req.user };
  }
}
