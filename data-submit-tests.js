import $ from 'jquery';
import { Tinytest } from 'meteor/tinytest';
import { splitData } from './lib/helpers/splitData.js';
import { filesToBuffer } from './lib/helpers/filesToBuffer.js';
import { call } from './lib/call.js';

// tests: helpers - splitData

Tinytest.add('helpers - splitData - fails with a non array argument', (test) => {
  test.throws(() => {
    splitData({});
  });
});

Tinytest.add('helpers - splitData - returns a correct object', (test) => {
  const res = splitData([
    { a: 1 },
    'b',
    'c',
  ]);

  test.instanceOf(res, Object);
  test.instanceOf(res.files, Object);
  test.instanceOf(res.files.list, Array);
  test.instanceOf(res.files.indexes, Array);
  test.instanceOf(res.values, Array);
});

Tinytest.add('helpers - splitData - returns only indexes with an empty file list', (test) => {
  const inputFile = $('<input type="file" />');

  const res = splitData([
    inputFile[0].files,
  ]);

  test.equal(res.files.list.length, 0);
  test.equal(res.files.indexes.length, 1);
});

Tinytest.add('helpers - splitData - files and values length = data length', (test) => {
  const inputFile = $('<input type="file" />');

  const data = [
    { a: 1 },
    inputFile[0].files,
    'b',
  ];

  const res = splitData(data);

  test.equal(res.files.indexes.length + res.values.length, data.length);
});

// tests: helpers - filesToBuffer

Tinytest.add('helpers - filesToBuffer - fails with a non array file list argument', (test) => {
  test.throws(() => {
    filesToBuffer({});
  });
});

Tinytest.add('helpers - filesToBuffer - returns a correct object', (test) => {
  const res = filesToBuffer([
    { a: 1 },
  ]);

  test.instanceOf(res, Object);
  test.instanceOf(res.list, Array);
  test.instanceOf(res.progress, Array);
});

Tinytest.add('helpers - filesToBuffer - list length = input length', (test) => {
  const input = [
    { a: 1 },
  ];

  const res = filesToBuffer(input);

  test.equal(res.list.length, input.length);
});

Tinytest.add('helpers - filesToBuffer - returns list with promises', (test) => {
  const input = [
    { a: 1 },
    { b: 2 },
  ];

  const res = filesToBuffer(input);

  res.list.forEach(item => {
    test.instanceOf(item, Promise);
  });
});

// tests: call

Tinytest.add('call - fails without config object', (test) => {
  test.throws(() => {
    call('');
  });
});

Tinytest.add('call - fails without method config', (test) => {
  test.throws(() => {
    call({});
  });
});
