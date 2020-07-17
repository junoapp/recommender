import * as datalib from 'datalib';

export function recursiveGroupBy(
  dataset: any[],
  keys: string[],
  group: { group?: any } = {},
  index = 0
) {
  if (keys.length === index) {
    return group;
  } else {
    const groupBy = datalib.groupby(keys[index]).execute(dataset);
    group.group = groupBy;
    index++;
    for (let i = 0; i < groupBy.length; i++) {
      const item = groupBy[i];
      recursiveGroupBy(item.values, keys, item, index);
    }
    return groupBy;
  }
}
