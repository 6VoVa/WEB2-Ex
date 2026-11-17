import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CountriesModule } from './countries/countries.module';
import { DatabaseConfig } from './config/database.config';
import { LocationsModule } from './locations/locations.module';
import { RegionsModule } from './regions/regions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new DatabaseConfig(config).createTypeOrmOptions(),
    }),
    CountriesModule,
    RegionsModule,
    LocationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
