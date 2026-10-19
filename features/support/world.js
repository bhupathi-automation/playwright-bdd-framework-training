import { World, setWorldConstructor } from '@cucumber/cucumber';
import config from '../../config/config.js';

/**
 * Scenario-scoped state shared by the hooks and step definitions.
 * Page Objects are assigned by the Before hook, not created here.
 */
export class CustomWorld extends World {
  /**
   * @param {import('@cucumber/cucumber').IWorldOptions} options
   */
  constructor(options) {
    super(options);

    /** @type {import('playwright').Browser|undefined} */
    this.browser = undefined;
    /** @type {import('playwright').BrowserContext|undefined} */
    this.context = undefined;
    /** @type {import('playwright').Page|undefined} */
    this.page = undefined;
    /** @type {import('../../src/pages/login.page.js').LoginPage|undefined} */
    this.loginPage = undefined;
    /** @type {import('../../src/pages/home.page.js').HomePage|undefined} */
    this.homePage = undefined;
    /** @type {import('../../src/pages/products.page.js').ProductsPage|undefined} */
    this.productsPage = undefined;
    /** @type {import('../../src/pages/product-details.page.js').ProductDetailsPage|undefined} */
    this.productDetailsPage = undefined;
    /** @type {import('../../src/pages/cart.page.js').CartPage|undefined} */
    this.cartPage = undefined;
    /** @type {import('../../src/pages/registration.page.js').RegistrationPage|undefined} */
    this.registrationPage = undefined;
    /** @type {import('../../src/api/api-client.js').ApiClient|undefined} */
    this.apiClient = undefined;
    /** @type {import('playwright').APIRequestContext|undefined} */
    this.apiRequestContext = undefined;
    /** @type {import('playwright').APIResponse|undefined} */
    this.apiResponse = undefined;
    /** @type {Record<string, unknown>|undefined} */
    this.apiResponseBody = undefined;
    /** @type {Record<string, string>|undefined} */
    this.apiTestAccount = undefined;
    /** @type {boolean} */
    this.apiTestAccountCreated = false;
    /** @type {boolean} */
    this.apiTestAccountDeleted = false;
    /** @type {boolean} */
    this.traceStarted = false;
    /** @type {string|undefined} */
    this.artifactId = undefined;
    /** @type {typeof config} */
    this.config = config;
  }
}

setWorldConstructor(CustomWorld);
