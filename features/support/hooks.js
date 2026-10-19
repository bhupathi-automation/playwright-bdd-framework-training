import { After, AfterAll, Before, BeforeAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { randomUUID } from 'node:crypto';
import { chromium, firefox, request, webkit } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import config from '../../config/config.js';
import logger from '../../utils/logger.js';
import { ApiClient } from '../../src/api/api-client.js';
import apiEndpoints from '../test-data/api-endpoints.json' with { type: 'json' };
import { CartPage } from '../../src/pages/cart.page.js';
import { HomePage } from '../../src/pages/home.page.js';
import { LoginPage } from '../../src/pages/login.page.js';
import { ProductDetailsPage } from '../../src/pages/product-details.page.js';
import { ProductsPage } from '../../src/pages/products.page.js';
import { RegistrationPage } from '../../src/pages/registration.page.js';

const browserTypes = Object.freeze({ chromium, firefox, webkit });

setDefaultTimeout(config.timeout.navigation);

BeforeAll(function () {
  logger.info('Cucumber test execution started');
});

AfterAll(function () {
  logger.info('Cucumber test execution completed');
});

/**
 * Create only the resources a scenario needs. API scenarios do not need a
 * browser; UI scenarios keep their browser objects scenario-scoped as before.
 */
Before(async function ({ pickle }) {
  logger.clearBuffer();
  this.artifactId = randomUUID();

  const isApiScenario = pickle.tags.some((tag) => tag.name === '@api');
  const isIntegrationScenario = pickle.tags.some((tag) => tag.name === '@integration');
  const isApiOnlyScenario = isApiScenario && !isIntegrationScenario;
  const tags = pickle.tags.map((tag) => tag.name).join(', ') || 'none';
  logger.info(`Scenario started: "${pickle.name}" tags=[${tags}]`);

  if (isApiScenario || isIntegrationScenario) {
    this.apiRequestContext = await request.newContext({
      baseURL: config.apiBaseUrl,
      timeout: config.timeout.navigation,
    });
    this.apiClient = new ApiClient(this.apiRequestContext, config.apiBaseUrl);
  }

  if (!isApiOnlyScenario) {
    logger.info(`Selected browser: ${config.browser.browserName}`);
    const browserType = browserTypes[config.browser.browserName];
    this.browser = await browserType.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
    });
    await this.attach(`Browser: ${config.browser.browserName}`, 'text/plain');
    /** @type {import('playwright').BrowserContextOptions} */
    const contextOptions = {
      baseURL: config.uiBaseUrl,
    };
    if (config.video.onFailure) {
      contextOptions.recordVideo = {
        dir: path.resolve('artifacts', 'videos'),
      };
    }
    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(config.timeout.action);
    this.page.setDefaultNavigationTimeout(config.timeout.navigation);

    this.loginPage = new LoginPage(this.page);
    this.homePage = new HomePage(this.page, config.uiBaseUrl);
    this.productsPage = new ProductsPage(this.page);
    this.productDetailsPage = new ProductDetailsPage(this.page);
    this.cartPage = new CartPage(this.page);
    this.registrationPage = new RegistrationPage(this.page);
  }

  // Browser tracing is only available for UI scenarios.
  if (!isApiOnlyScenario && config.trace.onFailure) {
    await this.context.tracing.start({
      screenshots: true,
      snapshots: true,
    });
    this.traceStarted = true;
  }
});

/**
 * Capture diagnostics before releasing the scenario resources.
 * @param {{pickle: {name: string}, result?: {status: string}, willBeRetried?: boolean}} testCase
 */
After(async function ({ pickle, result, willBeRetried }) {
  const failed = result?.status === Status.FAILED;
  const artifactName = pickle.name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const artifactFileName = `${artifactName || 'scenario'}-${this.artifactId}`;
  const video = config.video.onFailure ? this.page?.video() : undefined;

  if (failed) {
    logger.error(`Scenario failed: "${pickle.name}"`);
    if (willBeRetried) {
      logger.warn(`Cucumber will retry scenario: "${pickle.name}"`);
    } else {
      logger.error(`No further Cucumber retries are scheduled for: "${pickle.name}"`);
    }
    const logExcerpt = logger.getRecentLogs().join('\n');
    await this.attach(logExcerpt || 'No scenario log entries were recorded.', 'text/plain');
  } else {
    logger.info(`Scenario completed: "${pickle.name}" status=${result?.status ?? 'UNKNOWN'}`);
  }

  // Take a screenshot on scenario failure and store it in the screenshots folder.
  if (failed && config.screenshot.onFailure && this.page) {
    try {
      const screenshotDirectory = path.resolve('artifacts', 'screenshots');
      await mkdir(screenshotDirectory, { recursive: true });
      const screenshotPath = path.join(screenshotDirectory, `${artifactFileName}.png`);
      const screenshot = await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        mask: [this.page.locator('input[type="email"], input[type="password"]')],
      });
      await this.attach(screenshot, 'image/png');
      logger.info(`Failure screenshot saved: ${screenshotPath}`);
    } catch (error) {
      logger.error(`Could not capture failure screenshot: ${error.message}`);
    }
  }

  if (failed && config.trace.onFailure && this.traceStarted && this.context) {
    try {
      const traceDirectory = path.resolve('artifacts', 'traces');
      await mkdir(traceDirectory, { recursive: true });
      const tracePath = path.join(traceDirectory, `${artifactFileName}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      await this.attach(await readFile(tracePath), 'application/zip');
      this.traceStarted = false;
      logger.info(`Failure trace saved: ${tracePath}`);
    } catch (error) {
      logger.error(`Could not capture failure trace: ${error.message}`);
    }
  } else if (this.traceStarted && this.context) {
    await this.context.tracing.stop();
    this.traceStarted = false;
  }

  try {
    // Remove accounts created by a scenario unless its delete step already did so.
    if (this.apiTestAccountCreated && !this.apiTestAccountDeleted && this.apiTestAccount) {
      const response = await this.apiClient.delete(apiEndpoints.deleteAccount, {
        form: {
          email: this.apiTestAccount.email,
          password: this.apiTestAccount.password,
        },
      });
      this.apiClient.validateStatus(response, 200);

      const responseBody = await response.json();
      this.apiClient.validateResponseCode(responseBody, 200);
      this.apiClient.validateMessage(responseBody, 'Account deleted!');
    }
  } finally {
    // Dispose scenario-owned resources so state cannot leak into the next scenario.
    await this.apiRequestContext?.dispose();
    await this.context?.close();
    if (video) {
      try {
        if (failed) {
          const videoDirectory = path.resolve('artifacts', 'videos');
          await mkdir(videoDirectory, { recursive: true });
          const videoPath = path.join(videoDirectory, `${artifactFileName}.webm`);
          await video.saveAs(videoPath);
          await this.attach(await readFile(videoPath), 'video/webm');
          logger.info(`Failure video saved: ${videoPath}`);
        } else {
          await video.delete();
        }
      } catch (error) {
        logger.error(`Could not retain scenario video: ${error.message}`);
      }
    }
    await this.browser?.close();

    this.apiRequestContext = undefined;
    this.apiClient = undefined;
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }
});
