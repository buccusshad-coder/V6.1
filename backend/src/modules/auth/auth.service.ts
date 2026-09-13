import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, password_confirmation } = registerDto;

      if (password !== password_confirmation) {
        throw new BadRequestException('Passwords do not match');
      }

      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
      });

      await this.usersRepository.save(user);

      const access_token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('Auth Service Error:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    console.log('🔐 Login attempt:', loginDto.email);
    try {
      const { email, password } = loginDto;

      console.log('Querying user:', email);
      const user = await this.usersRepository.findOne({ where: { email } });
      console.log('User found:', !!user);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      console.log('Comparing passwords...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      console.log('Signing JWT...');
      const access_token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });
      console.log('✅ Login successful');

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async validateUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
