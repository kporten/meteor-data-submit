import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { splitData } from './helpers/splitData.js';
import { filesToBuffer } from './helpers/filesToBuffer.js';

/**
 * submit data to meteor methods
 * @param {Object} configArgs
 * @param {Array} ...dataArgs
 */
export function call(configArgs, ...dataArgs) {
  // check meteor config
  check(configArgs, Object);
  check(configArgs.method, String);

  const config = {
    method: configArgs.method,
    chunkUpload: _.isString(configArgs.chunkUpload) ? configArgs.chunkUpload : false,
    chunkBytes: _.isInteger(configArgs.chunkBytes) ? configArgs.chunkBytes : 128 * 1024,
  };

  // separate args in data and callbacks
  const callbacks = [];
  const data = _.filter(dataArgs, dataArg => {
    if (_.isFunction(dataArg)) {
      callbacks.push(dataArg);
      return false;
    }

    return true;
  });

  // set callback functions
  const methodCallback = callbacks[0] || _.noop;
  const statusCallback = callbacks[1] || _.noop;

  // separate data in files and values
  const { files: dataFiles, values: dataValues } = splitData(data);

  // read files, write buffer
  const buffer = filesToBuffer(
    dataFiles.list,
    config.chunkUpload,
    config.chunkBytes,
    statusCallback
  );

  dataFiles.list = buffer.list;
  dataFiles.progress = buffer.progress;

  // get results of all file promises
  Promise
  .all(dataFiles.list)
  .then(
    results => {
      dataFiles.list = results;

      // combine fileIndexes and fileList in files
      const files = {};
      _.forEach(dataFiles.indexes, (fileIndex, key) => {
        if (!_.isArray(files[fileIndex])) files[fileIndex] = [];
        const file = dataFiles.list[key];
        if (!_.isUndefined(file)) files[fileIndex].push(file);
      });

      // combine dataValues and files in dataValues
      _.forEach(files, (items, key) => {
        dataValues.splice(key, 0, items);
      });

      // success: submit results to meteor
      Meteor.call(config.method, undefined, ...dataValues, (...callArgs) => {
        const fileListSize = _.size(dataFiles.list);
        statusCallback(1, _.times(fileListSize, _.constant(1 / fileListSize)));
        methodCallback(...callArgs);
      });
    }
  )
  .catch(err => {
    // error: submit results to meteor
    Meteor.call(config.method, err.message, ...dataValues, (...callArgs) => {
      statusCallback(1);
      methodCallback(...callArgs);
    });
  });
}
