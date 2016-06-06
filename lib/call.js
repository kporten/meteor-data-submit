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

      // combine dataValues and dataFiles => dataValues
      _.forEach(dataFiles.list, (items, index) => {
        const fileIndex = dataFiles.indexes[index];
        const fileKey = dataFiles.keys[index];

        if (!_.isNull(fileKey)) {
          if (!_.isArray(dataValues[fileIndex][fileKey])) {
            dataValues[fileIndex][fileKey] = [];
          }

          dataValues[fileIndex][fileKey].push(items);
        } else {
          dataValues[fileIndex].push(items);
        }
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
