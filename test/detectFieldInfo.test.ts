import * as path from 'path';
import {
  detectFieldInfoFromCSV,
  detectFieldInfoFromPostgre,
} from '../src/detectFieldInfo';

describe('detectFieldInfoFromCSV', () => {
  it('vehicles', () => {
    const fields = detectFieldInfoFromCSV(
      path.join(__dirname, '../data/vehicles.csv'),
      ['pick_up_date', 'store', 'vehicle_class']
    );

    console.table(fields);
    expect(fields).toBeDefined();
  });

  it('covid-19', () => {
    const fields = detectFieldInfoFromCSV(
      path.join(__dirname, '../data/bing-covid-19.csv'),
      ['Updated', 'Country_Region', 'AdminRegion1', 'AdminRegion2']
    );

    console.table(fields);
    expect(fields).toBeDefined();
  });
});

describe('detectFieldInfoFromPostgre', () => {
  it('vehicles', async () => {
    const fields = await detectFieldInfoFromPostgre(
      {
        host: 'localhost',
        user: 'pricing',
        password: 'test',
        database: 'juno',
        port: 5432,
      },
      'vehicle2'
    );

    console.table(fields);
    expect(fields).toBeDefined();
  });

  it('covid-19', async () => {
    const fields = await detectFieldInfoFromPostgre(
      {
        host: 'localhost',
        user: 'pricing',
        password: 'test',
        database: 'juno',
        port: 5432,
      },
      'covid'
    );

    console.table(fields);
    expect(fields).toBeDefined();
  });
});
