import config from './config/config.js';

export default {
  paths: ['features/**/*.feature'],
  import: ['features/**/*.js'],
  format: [
    'progress',
    ['html', 'artifacts/reports/cucumber/cucumber.html'],
    'allure-cucumberjs/reporter',
  ],
  formatOptions: {
    resultsDir: 'artifacts/reports/allure-results',
  },
  parallel: 0,
  publishQuiet: true,
  retry: config.retry.cucumber,
};
