import _ from 'lodash';
import { check } from 'meteor/check';

/**
 * push files to list
 * @param {FileList|Blob} val
 * @param {Number} index
 * @param {String|null} key
 * @return {Object}
 */
function processFiles(val, index, key) {
  const files = {
    list: [],
    indexes: [],
    keys: [],
  };

  if (val instanceof Blob) {
    // push file to list
    files.list.push(val);
    files.indexes.push(index);
    files.keys.push(key);
  }

  if (val instanceof FileList) {
    if (val.length === 0) {
      // push empty file value
      files.list.push(null);
      files.indexes.push(index);
      files.keys.push(key);
    } else {
      // push all files and save related indexes
      _.forEach(val, file => {
        files.list.push(file);
        files.indexes.push(index);
        files.keys.push(key);
      });
    }
  }

  return files;
}

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
    keys: [],
  };

  // value part of data
  const values = [];

  _.forEach(data, (val, index) => {
    // process top level argument
    if (val instanceof FileList || val instanceof Blob) {
      const res = processFiles(val, index, null);

      files.list = files.list.concat(res.list);
      files.indexes = files.indexes.concat(res.indexes);
      files.keys = files.keys.concat(res.keys);

      values.push([]);
      return;
    }

    // search files in object on first level
    const item = _.isObject(val) && !_.isArray(val) ? _.assign({}, val) : val;

    if (_.isObject(item)) {
      _.forEach(item, (prop, key) => {
        if (prop instanceof FileList || prop instanceof Blob) {
          const res = processFiles(prop, index, key);

          files.list = files.list.concat(res.list);
          files.indexes = files.indexes.concat(res.indexes);
          files.keys = files.keys.concat(res.keys);

          delete item[key];
        }
      });
    }

    values.push(item);
  });

  // data is now separated
  return { files, values };
}
