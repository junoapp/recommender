import * as datalib from 'datalib';
import { readFileSync } from 'fs';

interface Field {
  group: 'dimension' | 'measure';
  name: string;
  type: string;
  count: number;
  valid: number;
  missing: number;
  distinct: number;
}

export const detectFieldInfo = (path: string) => {
  const file = readFileSync(path);
  const data = datalib.read(file, { type: 'csv', parse: 'auto' });

  const summary = datalib.format.summary(data);
  const stats = datalib.summary(data);

  const dimensions = [
    'pick_up_date',
    'store',
    'vehicle_class',
    'Updated',
    'Country_Region',
    'AdminRegion1',
    'AdminRegion2',
  ];

  const fields: Field[] = [];

  stats.forEach(stat => {
    fields.push({
      group: dimensions.includes(stat.field) ? 'dimension' : 'measure',
      name: stat.field,
      type: stat.type,
      count: stat.count,
      valid: stat.valid,
      missing: stat.missing,
      distinct: stat.distinct,
    });
  });

  // const grouped = recursiveGroupBy(data, dimensions);
  // console.log(grouped);

  // fields.sort((a, b) => {
  //   if (a.valid === b.valid) {
  //     if (a.missing === b.missing) {
  //       // if (a.distinct === b.distinct) {
  //       //   return b.distinct - b.distinct;
  //       // }

  //       return b.distinct - a.distinct;
  //     }

  //     return b.missing - b.missing;
  //   }

  //   return b.valid - a.valid;
  // });

  console.table(fields);

  return summary;
};
