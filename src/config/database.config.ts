import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const password = this.config.get<string>('DB_PASS');
    if (!password) {
      throw new Error('DB_PASS environment variable is required');
    }

    return {
      type: 'postgres',
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: Number(this.config.get<string>('DB_PORT', '5432')),
      username: this.config.get<string>('DB_USER', 'appuser'),
      password,
      database: this.config.get<string>('DB_NAME', 'appdb'),
      autoLoadEntities: true,
      synchronize: this.config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      logging: this.config.get<string>('DB_LOGGING', 'false') === 'true',
      ssl:
        this.config.get<string>('DB_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }
}
