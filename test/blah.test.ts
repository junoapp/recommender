import { detectFieldInfo } from '../src';

describe('detectFieldInfo', () => {
  it('vehicles', () => {
    expect(detectFieldInfo('../data/vehicles.csv')).toBeDefined();
  });

  it('covid-19', () => {
    expect(detectFieldInfo('../data/bing-covid-19.csv')).toBeDefined();
  });
});
