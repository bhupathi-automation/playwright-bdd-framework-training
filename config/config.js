import process from 'node:process';
import { URL } from 'node:url';
import { config as loadDotenv } from 'dotenv';

// Loading .env is optional. GitHub Actions supplies environment variables directly.
loadDotenv({ quiet: true });

const isCi = process.env.CI === 'true';
const supportedBrowsers = ['chromium', 'firefox', 'webkit'];

/**
 * Convert a text environment variable into a boolean.
 * @param {string|undefined} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function readBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`Expected a boolean value, received "${value}".`);
}

/**
 * Convert a text environment variable into a non-negative integer.
 * @param {string|undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
function readInteger(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`Expected a non-negative integer, received "${value}".`);
  }

  return parsedValue;
}

/**
 * Read a URL and remove a trailing slash so URL composition remains predictable.
 * @param {string|undefined} value
 * @param {string} defaultValue
 * @returns {string}
 */
function readUrl(value, defaultValue) {
  return (value ?? defaultValue).replace(/\/$/, '');
}

/**
 * Read the selected Playwright browser.
 * @param {string|undefined} value
 * @returns {'chromium'|'firefox'|'webkit'}
 */
function readBrowserName(value) {
  switch (value) {
    case undefined:
    case 'chromium':
      return 'chromium';
    case 'firefox':
      return 'firefox';
    case 'webkit':
      return 'webkit';
    default:
      throw new Error(
        `Unsupported browser: "${value}". Expected one of: ${supportedBrowsers.join(', ')}.`,
      );
  }
}

/**
 * @typedef {object} FrameworkConfig
 * @property {string} environment
 * @property {string} uiBaseUrl
 * @property {string} apiBaseUrl
 * @property {{browserName: 'chromium'|'firefox'|'webkit', headless: boolean, slowMo: number}} browser
 * @property {{action: number, navigation: number, assertion: number}} timeout
 * @property {{cucumber: number, browser: number}} retry
 * @property {{onFailure: boolean, mode: 'on'|'off'}} screenshot
 * @property {{onFailure: boolean, mode: 'on'|'off'}} trace
 * @property {{onFailure: boolean}} video
 * @property {boolean} isCi
 */

/**
 * One QA configuration for local development and GitHub Actions.
 * Environment variables override defaults but do not create another environment.
 * @type {Readonly<FrameworkConfig>}
 */
export const config = Object.freeze({
  environment: 'qa',
  uiBaseUrl: readUrl(process.env.BASE_URL, 'https://automationexercise.com'),
  apiBaseUrl: readUrl(process.env.API_BASE_URL, 'https://automationexercise.com/api'),
  browser: Object.freeze({
    browserName: readBrowserName(process.env.BROWSER),
    headless: readBoolean(process.env.HEADLESS, isCi),
    slowMo: readInteger(process.env.SLOW_MO, 0),
  }),
  timeout: Object.freeze({
    action: readInteger(process.env.ACTION_TIMEOUT, 10_000),
    navigation: readInteger(process.env.NAVIGATION_TIMEOUT, 30_000),
    assertion: readInteger(process.env.ASSERTION_TIMEOUT, 5_000),
  }),
  retry: Object.freeze({
    cucumber: readInteger(process.env.CUCUMBER_RETRIES, 0),
    browser: readInteger(process.env.BROWSER_RETRIES, isCi ? 1 : 0),
  }),
  screenshot: Object.freeze({
    onFailure: readBoolean(process.env.SCREENSHOT_ON_FAILURE, true),
    mode: 'on',
  }),
  trace: Object.freeze({
    onFailure: readBoolean(process.env.TRACE_ON_FAILURE, false),
    mode: 'on',
  }),
  video: Object.freeze({
    onFailure: readBoolean(process.env.VIDEO_ON_FAILURE, false),
  }),
  isCi,
});

/**
 * Validate configuration at startup so setup errors fail before a scenario runs.
 * @param {FrameworkConfig} currentConfig
 * @returns {void}
 */
function validateConfig(currentConfig) {
  const urls = [currentConfig.uiBaseUrl, currentConfig.apiBaseUrl];
  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid configuration URL: "${url}".`);
    }
  }

  if (currentConfig.screenshot.mode !== 'on' || currentConfig.trace.mode !== 'on') {
    throw new Error('Screenshot and trace modes must remain set to "on".');
  }
}

validateConfig(config);

export default config;
