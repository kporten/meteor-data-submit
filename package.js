/* global Package */

Package.describe({
  name: 'kporten:data-submit',
  version: '0.3.0',
  summary: 'Submit your form values and files easily',
  git: 'https://github.com/kporten/meteor-data-submit',
  documentation: 'README.md',
});

Package.onUse(function onUse(api) {
  api.versionsFrom('1.3.2.4');
  api.use('check');
  api.use('ecmascript');
  api.use('random');
  api.mainModule('data-submit.js', 'client');
});

Package.onTest(function onTest(api) {
  api.use('check');
  api.use('ecmascript');
  api.use('tinytest');
  api.use('kporten:data-submit');
  api.mainModule('data-submit-tests.js', 'client');
});
