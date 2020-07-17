import * as path from 'path';
import { detectFieldInfo } from '../src';

describe('detectFieldInfo', () => {
  it('vehicles', () => {
    expect(
      detectFieldInfo(path.join(__dirname, '../data/vehicles.csv'))
    ).toBeDefined();
  });

  it('covid-19', () => {
    expect(
      detectFieldInfo(path.join(__dirname, '../data/bing-covid-19.csv'))
    ).toBeDefined();
  });
});
