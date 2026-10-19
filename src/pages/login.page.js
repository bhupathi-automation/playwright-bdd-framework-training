import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/** Page Object for login and the initial signup form. */
export class LoginPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.loginHeading = page.getByRole('heading', { name: 'Login to your account' });
    this.loginEmailInput = page.getByRole('textbox', { name: 'Email Address' }).first();
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.signupHeading = page.getByRole('heading', { name: 'New User Signup!' });
    this.signupNameInput = page.getByRole('textbox', { name: 'Name', exact: true });
    this.signupEmailInput = page.getByRole('textbox', { name: 'Email Address' }).nth(1);
    this.signupButton = page.getByRole('button', { name: 'Signup', exact: true });
    this.loginError = page.getByText('Your email or password is incorrect!', { exact: true });
  }

  /** Open the login and signup page.
   * @returns {Promise<void>}
   */
  async open() {
    logger.info('Opening login and signup page');
    await this.page.goto('/login');
  }

  /** Enter credentials and submit the login form.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  async login(email, password) {
    logger.info('Submitting login form');
    await this.loginEmailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Begin signup with the supplied name and email address.
   * @param {string} name
   * @param {string} email
   * @returns {Promise<void>}
   */
  async startSignup(name, email) {
    logger.info('Submitting initial signup details');
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupButton.click();
  }

  /** Verify that the login and signup forms are visible.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.loginHeading).toBeVisible();
    await expect(this.signupHeading).toBeVisible();
  }

  /** Verify that login credentials are required and the email uses email validation.
   * @returns {Promise<void>}
   */
  async assertLoginCredentialsAreRequired() {
    await expect(this.loginEmailInput).toHaveAttribute('type', 'email');
    await expect(this.loginEmailInput).toHaveAttribute('required', '');
    await expect(this.passwordInput).toHaveAttribute('required', '');
  }

  /** Verify the application's invalid-credentials message.
   * @returns {Promise<void>}
   */
  async assertLoginFailed() {
    await expect(this.loginError).toBeVisible();
  }
  async assertLoginFailedForInvalidCreds(errorMessage) {
    await expect(this.loginError).toBeVisible();
    await expect(this.loginError).toHaveText(errorMessage);
    logger.debug('Invalid-login feedback matched the expected message');
  }
}
