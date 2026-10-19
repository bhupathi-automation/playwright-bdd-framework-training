import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/**
 * Page Object for the AutomationExercise home page.
 */
export class HomePage {
  /**
   * @param {import('playwright').Page} page
   * @param {string} baseUrl
   */
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.homeHeading = page.getByRole('heading', { name: 'AutomationExercise', exact: true });
    this.productsLink = page.getByRole('link', { name: /Products/ });
    this.cartLink = page.getByRole('link', { name: /Cart/ });
    this.loginLink = page.getByRole('link', { name: /Signup \/ Login/ });
    this.loggedInUser = page.locator('a').filter({ has: page.locator('b') });
  }

  /**
   * Open the home page.
   * @returns {Promise<void>}
   */
  async open() {
    logger.info('Opening home page');
    await this.page.goto(this.baseUrl);
  }

  /**
   * Verify the page title exposed by the application.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.page).toHaveTitle('Automation Exercise');
    await expect(this.homeHeading).toBeVisible();
  }

  /** Verify that the primary shopping destinations are available.
   * @returns {Promise<void>}
   */
  async assertNavigationDisplayed() {
    await expect(this.productsLink).toBeVisible();
    await expect(this.cartLink).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }

  /** Open the product catalog from the site navigation.
   * @returns {Promise<void>}
   */
  async openProducts() {
    logger.info('Opening product catalog from home navigation');
    await this.productsLink.click();
  }

  /** Open the shopping cart from the site navigation.
   * @returns {Promise<void>}
   */
  async openCart() {
    logger.info('Opening cart from home navigation');
    await this.cartLink.click();
  }

  /** Open the login and signup page from the site navigation.
   * @returns {Promise<void>}
   */
  async openLogin() {
    logger.info('Opening login page from home navigation');
    await this.loginLink.click();
  }

  /**
   * Verify the logged-in user is displayed in the navigation bar.
   * @param {string} username - The username expected to be visible after login.
   * @returns {Promise<void>}
   */
  async assertLoggedInUser(username) {
    await expect(this.loggedInUser).toContainText(username);
  }
}
