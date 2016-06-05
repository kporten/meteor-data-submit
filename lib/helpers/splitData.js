import _ from 'lodash';
import { check } from 'meteor/check';

/**
 * separate data in files and values
 * @param {Array} data
 * @return {Object}
 */
export function splitData(data) {
  check(data, Array);

  // file part of data
  const files = {
    list: [],
    indexes: [],
  };

  // value part of data
  const values = _.filter(data, (val, key) => {
    if (val instanceof FileList) {
      if (val.length === 0) {
        // push empty file value
        files.indexes.push(key);
      } else {
        // push all files and save related indexes
        _.forEach(val, file => {
          files.list.push(file);
          files.indexes.push(key);
        });
      }

      return false;
    }

    return true;
  });

  // data is now separated
  return { files, values };
}
