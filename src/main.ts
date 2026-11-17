import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('web2-exam API')
    .setDescription(
      'CRUD API for the Country -> Region -> Location hierarchy. ' +
        'Countries have many regions; regions have many locations.',
    )
    .setVersion('1.0.0')
    .addTag('Countries')
    .addTag('Regions')
    .addTag('Locations')
    .addTag('Health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'web2-exam API docs',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(configService.get<string>('PORT', '3000'));
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
