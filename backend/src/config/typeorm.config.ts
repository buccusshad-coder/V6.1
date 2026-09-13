import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const host = this.configService?.get('DB_HOST') || 'localhost';
    const port = this.configService?.get('DB_PORT') || 5432;
    const username = this.configService?.get('DB_USERNAME') || 'tracker';
    const password = this.configService?.get('DB_PASSWORD') || 'tracker_password';
    const database = this.configService?.get('DB_NAME') || 'tracker_v7';
    const sync = this.configService?.get('DB_SYNC') !== 'false';
    const logging = this.configService?.get('DB_LOGGING') === 'true';

    // Enable SSL for Supabase and cloud databases
    const enableSsl = host.includes('supabase') || this.configService?.get('DB_SSL') === 'true';

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/database/migrations/*{.ts,.js}'],
      subscribers: ['dist/**/*.subscriber{.ts,.js}'],
      synchronize: sync,
      logging,
      dropSchema: false,
      ssl: enableSsl ? { rejectUnauthorized: false } : false,
      extra: {
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };
  }
}
