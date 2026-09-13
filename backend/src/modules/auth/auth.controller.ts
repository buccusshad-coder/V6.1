import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from '../../guards/jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Login error:', error.message, error.stack);
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    const user = await this.authService.validateUser(req.user.userId);
    return {
      id: user.id,
      email: user.email,
    };
  }
}
