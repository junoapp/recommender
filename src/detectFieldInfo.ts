import * as datalib from 'datalib';
import { Client } from 'pg';
import { readFileSync } from 'fs';

interface Field {
  group: 'dimension' | 'measure' | 'helper';
  name: string;
  type: string;
  count: number;
  valid: number;
  missing: number;
  distinct: number;
  isGeo: boolean;
}

const geoMap = [
  'latitude',
  'longitude',
  'lat',
  'lng',
  'country',
  'region',
  'iso',
];

export const detectFieldInfoFromCSV = (
  path: string,
  dimensions: string[]
): Field[] => {
  const file = readFileSync(path);
  const data = datalib.read(file, { type: 'csv', parse: 'auto' });

  const stats = datalib.summary(data);

  let fields: Field[] = [];

  stats.forEach(stat => {
    fields.push({
      group: dimensions.includes(stat.field) ? 'dimension' : 'measure',
      name: stat.field,
      type: stat.type,
      count: stat.count,
      valid: stat.valid,
      missing: stat.missing,
      distinct: stat.distinct,
      isGeo: false,
    });
  });

  fields = sortFields(fields);

  // calculateCorrelation(fields, data);
  recommender(fields);

  return fields;
};

export const detectFieldInfoFromPostgre = async (
  connectionInfo: {
    database: string;
    host: string;
    user: string;
    password: string;
    port: number;
  },
  table: string
) => {
  const db = new Client(connectionInfo);
  await db.connect();

  const columns = await db.query(
    `SELECT
      columns.column_name AS name,
      columns.data_type AS type,
      columns.udt_name::regtype AS udt,
      columns.column_default AS default,
      columns.is_nullable::boolean AS nullable,
      columns.character_maximum_length AS length,
      attributes.attndims AS dimensions
    FROM 
      information_schema.columns AS columns
    JOIN 
      pg_catalog.pg_attribute AS attributes ON 
      attributes.attrelid = columns.table_name::regclass AND 
      attributes.attname = columns.column_name AND NOT 
      attributes.attisdropped
    WHERE 
      columns.table_schema = 'public' AND 
      columns.table_name = $1
    ORDER BY 
      ordinal_position`,
    [table]
  );

  const foreignKeys = await db.query(
    `SELECT
      tc.table_schema, 
      tc.constraint_name, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON 
        tc.constraint_name = kcu.constraint_name AND 
        tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu ON 
        ccu.constraint_name = tc.constraint_name AND 
        ccu.table_schema = tc.table_schema
    WHERE 
      tc.constraint_type = 'FOREIGN KEY' AND 
      tc.table_name = $1`,
    [table]
  );

  let fields: Field[] = [];

  const count = await db.query(`SELECT COUNT(*) as "count" FROM ${table}`);

  const typeMap: Record<string, string> = {
    numeric: 'number',
    'character varying': 'string',
    'timestamp without time zone': 'date',
  };

  for (const row of columns.rows) {
    const valid = await db.query(
      `SELECT COUNT(*) as "count" FROM ${table} WHERE "${row.name}" IS NOT NULL`
    );
    const distinct = await db.query(
      `SELECT COUNT(DISTINCT("${row.name}")) as "count" FROM ${table}`
    );

    if (row.type === 'numeric') {
      const float = await db.query(
        `SELECT COUNT("${row.name}") as "count" FROM ${table} WHERE "${row.name}" <> FLOOR("${row.name}") AND "${row.name}" IS NOT NULL`
      );

      if (float.rows[0].count > 0) {
        row.type = 'number';
      } else {
        row.type = 'integer';
      }
    }

    fields.push({
      group: foreignKeys.rows.find(r => r.column_name === row.name)
        ? 'dimension'
        : 'measure',
      name: row.name,
      type: typeMap[row.type] || row.type,
      count: +count.rows[0].count,
      valid: +valid.rows[0].count,
      missing: +count.rows[0].count - +valid.rows[0].count,
      distinct: +distinct.rows[0].count,
      isGeo: false,
    });
  }

  fields = sortFields(fields);

  // const data = await db.query(`SELECT * FROM ${table}`);

  // calculateCorrelation(fields, data.rows);
  recommender(fields);

  return fields;
};

function sortFields(fields: Field[]): Field[] {
  fields = fields
    .filter(
      field =>
        !(
          field.count === field.valid &&
          field.count === field.distinct &&
          field.missing === 0
        )
    )
    .map(field => {
      const name = field.name
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[0-9]/g, '')
        .toLowerCase()
        .split(' ');

      const filter = name.filter(value => geoMap.includes(value));

      return {
        ...field,
        isGeo: filter.length > 0,
      };
    })
    .sort((a, b) => {
      if (a.group === b.group) {
        if (a.missing === b.missing) {
          if (a.type === 'date' && b.type !== 'date') {
            return -1;
          }

          if (a.type !== 'date' && b.type === 'date') {
            return 1;
          }

          return b.distinct - a.distinct;
        }

        return a.missing - b.missing;
      }

      if (a.group === 'dimension') {
        return -1;
      }

      if (b.group === 'dimension') {
        return 1;
      }

      return 0;
    });

  return fields;
}

function recommender(fields: Field[]) {
  const charts = [];

  for (const field of fields) {
    if (field.group === 'measure') {
      charts.push({
        type: 'chart',
        name: field.name,
        chartType: 'stat',
        function: 'sum',
      });
    }
  }

  for (const field of fields) {
    if (field.group === 'dimension') {
      if (field.distinct < 300) {
        charts.push({
          type: 'filter',
          name: field.name,
        });
      }

      charts.push({
        type: 'chart',
        name: field.name,
        chartType: 'line',
        columns: fields
          .filter(f => f.group === 'measure')
          .map(f => f.name)
          .join(', '),
      });
    }
  }

  console.table(charts);
}

function calculateCorrelation(fields: Field[], data: any[]) {
  const numbers = fields.filter(
    f => f.group === 'measure' && ['integer', 'number'].includes(f.type)
  );

  const corr = [];

  console.log(datalib.cor);

  for (const number1 of numbers) {
    for (const number2 of numbers) {
      if (number1.name !== number2.name) {
        corr.push({
          field1: number1.name,
          field2: number2.name,
          cor1: (datalib.cor as datalib.corB)(
            data,
            (d: any) => d[number1.name],
            (d: any) => d[number2.name]
          ),
          cor2: (datalib.cor as datalib.corC).rank(
            data,
            (d: any) => d[number1.name],
            (d: any) => d[number2.name]
          ),
          // cor3: (datalib.cor as datalib.corC).dist(
          //   data,
          //   (d: any) => d[number1.name],
          //   (d: any) => d[number2.name]
          // ),
          cor4: datalib.cohensd(
            data,
            (d: any) => d[number1.name],
            (d: any) => d[number2.name]
          ),
        });
      }
    }
  }

  console.table(corr);
}
