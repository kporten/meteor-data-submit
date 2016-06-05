import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { check } from 'meteor/check';

/**
 * read file list, write buffer or upload files in chunks
 * @param {Array} fileList
 * @param {String} chunkUpload optional
 * @param {Integer} chunkBytes optional
 * @param {Function} callback optional
 * @return {Object}
 */
export function filesToBuffer(fileList, chunkUpload, chunkBytes, callback) {
  check(fileList, Array);

  // check all requirements for a chunk upload
  const isChunkUpload =
    _.isString(chunkUpload) &&
    _.isInteger(chunkBytes) &&
    _.isFunction(callback);

  // container for the progress of each file
  const listProgress = [];

  // generate upload promises for each file
  const list = fileList.map((file, key) => (
    new Promise((resolve, reject) => {
      const fileObj = {
        name: file.name,
        size: file.size,
        type: file.type,
        id: Random.id(),
      };

      // split the file in chunks ...
      let fileChunkBytes = chunkBytes;

      // ... or take the whole file
      if (!isChunkUpload) {
        fileChunkBytes = file.size;
      }

      // recursive file uploader
      function uploadChunkFile(loaded) {
        const loadEnd = loaded + fileChunkBytes;
        const chunkFile = file.slice(loaded, loadEnd);
        const reader = new FileReader();

        // file load handler
        reader.onload = () => {
          if (isChunkUpload) {
            // chunk upload, call specified meteor method with the current chunk as argument
            Meteor.call(
              chunkUpload,
              fileObj,
              new Uint8Array(reader.result),
              () => {
                // save current file progress
                listProgress[key] =
                  _.min([loadEnd, file.size]) / file.size / fileList.length * 0.95;

                // call the status update function
                callback(_.sum(listProgress), listProgress);

                // check if this is the last chunk ...
                if (loadEnd >= file.size) {
                  resolve(fileObj);
                  return;
                }

                // ... else upload the next chunk
                uploadChunkFile(loadEnd);
              }
            );
          } else {
            // write the file buffer to the result file object
            fileObj.buffer = new Uint8Array(reader.result);
            resolve(fileObj);
          }
        };

        // file error handler
        reader.onerror = err => {
          reject(err);
        };

        // file progress handler
        if (!isChunkUpload) {
          reader.onprogress = progress => {
            listProgress[key] = progress.loaded / file.size / fileList.length * 0.95;
            callback(_.sum(listProgress), listProgress);
          };
        }

        // read the current file part
        reader.readAsArrayBuffer(chunkFile);
      }

      // start the upload with byte 0
      uploadChunkFile(0);
    })
  ));

  // return the file promise list and the file progress list
  return { list, progress: listProgress };
}
