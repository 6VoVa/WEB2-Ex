import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Country } from '../countries/entities/country.entity';
import { Location } from '../locations/entities/location.entity';
import { Region } from '../regions/entities/region.entity';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const countries = app.get<Repository<Country>>(getRepositoryToken(Country));
  const regions = app.get<Repository<Region>>(getRepositoryToken(Region));
  const locations = app.get<Repository<Location>>(getRepositoryToken(Location));

  const country = await countries
    .findOne({ where: { code: 'MD' } })
    .then(
      (existing) => existing ?? countries.save(countries.create({ name: 'Moldova', code: 'MD' })),
    );

  const regionData = [
    { name: 'Centre', code: 'CE' },
    { name: 'North', code: 'NO' },
    { name: 'South', code: 'SO' },
  ];

  for (const data of regionData) {
    const region = await regions
      .findOne({
        where: { countryId: country.id, code: data.code },
      })
      .then(
        (existing) => existing ?? regions.save(regions.create({ ...data, countryId: country.id })),
      );

    const locationData =
      region.code === 'CE'
        ? [
            { name: 'Chișinău', type: 'city', population: 639000 },
            { name: 'Bălți', type: 'city', population: 102457 },
          ]
        : region.code === 'NO'
          ? [{ name: 'Soroca', type: 'city', population: 35000 }]
          : [{ name: 'Cahul', type: 'city', population: 30000 }];

    for (const location of locationData) {
      const exists = await locations.exists({
        where: { regionId: region.id, name: location.name },
      });
      if (!exists) {
        await locations.save(locations.create({ ...location, regionId: region.id }));
      }
    }
  }

  Logger.log('Seed data is ready', 'Seed');
  await app.close();
}

seed().catch((error: unknown) => {
  Logger.error(error, undefined, 'Seed');
  process.exitCode = 1;
});
