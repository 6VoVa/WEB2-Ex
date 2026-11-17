import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { newDb, DataType } from 'pg-mem';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CountriesController } from '../src/countries/countries.controller';
import { CountriesService } from '../src/countries/countries.service';
import { Country } from '../src/countries/entities/country.entity';
import { Location } from '../src/locations/entities/location.entity';
import { LocationsController } from '../src/locations/locations.controller';
import { LocationsService } from '../src/locations/locations.service';
import { Region } from '../src/regions/entities/region.entity';
import { RegionsController } from '../src/regions/regions.controller';
import { RegionsService } from '../src/regions/regions.service';

describe('Country -> Region -> Location API (e2e, in-memory PostgreSQL)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let countryId: number;
  let regionId: number;
  let locationId: number;
  let openApiDocument: OpenAPIObject;

  beforeAll(async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL 16.0 (pg-mem)',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'web2_exam_test',
    });
    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Country, Region, Location],
      synchronize: true,
    });
    await dataSource.initialize();

    const moduleRef = await Test.createTestingModule({
      controllers: [CountriesController, RegionsController, LocationsController],
      providers: [
        CountriesService,
        RegionsService,
        LocationsService,
        { provide: getRepositoryToken(Country), useValue: dataSource.getRepository(Country) },
        { provide: getRepositoryToken(Region), useValue: dataSource.getRepository(Region) },
        { provide: getRepositoryToken(Location), useValue: dataSource.getRepository(Location) },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    const swaggerConfig = new DocumentBuilder()
      .setTitle('web2-exam API')
      .setVersion('1.0.0')
      .addTag('Countries')
      .addTag('Regions')
      .addTag('Locations')
      .build();
    openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, openApiDocument);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('documents every endpoint in the OpenAPI document', async () => {
    expect(Object.keys(openApiDocument.paths)).toEqual(
      expect.arrayContaining([
        '/countries',
        '/countries/{id}',
        '/countries/{id}/regions',
        '/countries/{id}/locations',
        '/regions',
        '/regions/{id}',
        '/regions/{id}/locations',
        '/locations',
        '/locations/{id}',
      ]),
    );
    expect(openApiDocument.paths['/countries']?.post?.requestBody).toBeDefined();
    expect(openApiDocument.paths['/countries/{id}']?.get?.parameters).toBeDefined();

    await request(app.getHttpServer()).get('/api/docs').expect(200).expect('Content-Type', /html/);
    const swaggerJson = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(swaggerJson.body.paths['/countries']).toBeDefined();
  });

  it('creates a country, region and location and reads them back', async () => {
    const country = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Moldova', code: 'md' })
      .expect(201);
    expect(country.body).toMatchObject({ name: 'Moldova', code: 'MD' });
    countryId = country.body.id;

    const region = await request(app.getHttpServer())
      .post('/regions')
      .send({ name: 'Centre', code: 'ce', countryId })
      .expect(201);
    expect(region.body).toMatchObject({ name: 'Centre', code: 'CE', countryId });
    regionId = region.body.id;

    const location = await request(app.getHttpServer())
      .post('/locations')
      .send({ name: 'Chișinău', type: 'city', population: 639000, regionId })
      .expect(201);
    expect(location.body).toMatchObject({ name: 'Chișinău', regionId });
    locationId = location.body.id;

    await request(app.getHttpServer()).get(`/countries/${countryId}`).expect(200);
    await request(app.getHttpServer()).get(`/regions/${regionId}`).expect(200);
    await request(app.getHttpServer()).get(`/locations/${locationId}`).expect(200);
    await request(app.getHttpServer()).get('/countries').expect(200);
    await request(app.getHttpServer()).get('/regions').expect(200);
    await request(app.getHttpServer()).get('/locations').expect(200);
  });

  it('serves the nested relation endpoints', async () => {
    const regions = await request(app.getHttpServer())
      .get(`/countries/${countryId}/regions`)
      .expect(200);
    expect(regions.body).toHaveLength(1);
    expect(regions.body[0].id).toBe(regionId);

    const locations = await request(app.getHttpServer())
      .get(`/regions/${regionId}/locations`)
      .expect(200);
    expect(locations.body).toHaveLength(1);

    const countryLocations = await request(app.getHttpServer())
      .get(`/countries/${countryId}/locations`)
      .expect(200);
    expect(countryLocations.body).toHaveLength(1);
    expect(countryLocations.body[0].region.id).toBe(regionId);
  });

  it('validates input and rejects duplicates and missing parents', async () => {
    await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Moldova', code: 'MD' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'X', code: 'invalid' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Test', code: 'TT', unexpected: true })
      .expect(400);

    await request(app.getHttpServer())
      .post('/regions')
      .send({ name: 'Ghost', code: 'GH', countryId: 99999 })
      .expect(404);
  });

  it('updates all three entities', async () => {
    const country = await request(app.getHttpServer())
      .put(`/countries/${countryId}`)
      .send({ name: 'Republic of Moldova' })
      .expect(200);
    expect(country.body.name).toBe('Republic of Moldova');

    const region = await request(app.getHttpServer())
      .put(`/regions/${regionId}`)
      .send({ name: 'Central' })
      .expect(200);
    expect(region.body.name).toBe('Central');

    const location = await request(app.getHttpServer())
      .put(`/locations/${locationId}`)
      .send({ population: 650000 })
      .expect(200);
    expect(location.body.population).toBe(650000);

    const otherCountry = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Romania', code: 'RO' })
      .expect(201);
    const otherRegion = await request(app.getHttpServer())
      .post('/regions')
      .send({ name: 'Moldavia', code: 'MO', countryId: otherCountry.body.id })
      .expect(201);

    const movedRegion = await request(app.getHttpServer())
      .put(`/regions/${regionId}`)
      .send({ countryId: otherCountry.body.id })
      .expect(200);
    expect(movedRegion.body.countryId).toBe(otherCountry.body.id);

    const movedLocation = await request(app.getHttpServer())
      .put(`/locations/${locationId}`)
      .send({ regionId: otherRegion.body.id })
      .expect(200);
    expect(movedLocation.body.regionId).toBe(otherRegion.body.id);

    const otherCountryLocations = await request(app.getHttpServer())
      .get(`/countries/${otherCountry.body.id}/locations`)
      .expect(200);
    expect(otherCountryLocations.body[0].id).toBe(locationId);

    await request(app.getHttpServer()).put(`/regions/${regionId}`).send({ countryId }).expect(200);
    await request(app.getHttpServer())
      .put(`/locations/${locationId}`)
      .send({ regionId })
      .expect(200);
    await request(app.getHttpServer()).delete(`/countries/${otherCountry.body.id}`).expect(204);
  });

  it('deletes a country with its descendants (ON DELETE CASCADE)', async () => {
    await request(app.getHttpServer()).delete(`/locations/${locationId}`).expect(204);
    await request(app.getHttpServer()).delete(`/regions/${regionId}`).expect(204);
    await request(app.getHttpServer()).delete(`/countries/${countryId}`).expect(204);

    await request(app.getHttpServer()).get(`/countries/${countryId}`).expect(404);

    const secondCountry = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Romania', code: 'RO' })
      .expect(201);
    const secondRegion = await request(app.getHttpServer())
      .post('/regions')
      .send({ name: 'Moldavia', code: 'MO', countryId: secondCountry.body.id })
      .expect(201);
    await request(app.getHttpServer())
      .post('/locations')
      .send({ name: 'Iași', regionId: secondRegion.body.id })
      .expect(201);

    await request(app.getHttpServer()).delete(`/countries/${secondCountry.body.id}`).expect(204);
    expect(await dataSource.getRepository(Region).count()).toBe(0);
    expect(await dataSource.getRepository(Location).count()).toBe(0);
  });
});
