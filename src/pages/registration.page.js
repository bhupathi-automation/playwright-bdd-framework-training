import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/** @typedef {{day: string, month: string, year: string}} BirthDate */

/**
 * @typedef {object} RegistrationDetails
 * @property {string} password
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} address
 * @property {string} state
 * @property {string} city
 * @property {string} zipcode
 * @property {string} mobileNumber
 * @property {string} [title]
 * @property {BirthDate} [birthDate]
 * @property {string} [company]
 * @property {string} [address2]
 * @property {string} [country]
 * @property {boolean} [newsletter]
 * @property {boolean} [specialOffers]
 */

/** Page Object for the account information and address registration form. */
export class RegistrationPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.accountHeading = page.getByRole('heading', { name: 'Enter Account Information' });
    this.mrRadio = page.getByRole('radio', { name: 'Mr.' });
    this.mrsRadio = page.getByRole('radio', { name: 'Mrs.' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password *' });
    this.daySelect = page.locator('#days');
    this.monthSelect = page.locator('#months');
    this.yearSelect = page.locator('#years');
    this.newsletterCheckbox = page.getByRole('checkbox', { name: 'Sign up for our newsletter!' });
    this.specialOffersCheckbox = page.getByRole('checkbox', {
      name: 'Receive special offers from our partners!',
    });
    this.firstNameInput = page.getByRole('textbox', { name: 'First name *' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name *' });
    this.companyInput = page.getByRole('textbox', { name: 'Company' });
    this.addressInput = page.getByRole('textbox', { name: /^Address \*/ });
    this.address2Input = page.getByRole('textbox', { name: 'Address 2' });
    this.countrySelect = page.getByRole('combobox', { name: 'Country *' });
    this.stateInput = page.getByRole('textbox', { name: 'State *' });
    this.cityInput = page.getByRole('textbox', { name: /City/ });
    this.zipcodeInput = page.locator('#zipcode');
    this.mobileNumberInput = page.getByRole('textbox', { name: 'Mobile Number *' });
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' });
  }

  /** Verify that the registration form is displayed.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.page).toHaveURL(/\/signup$/);
    await expect(this.accountHeading).toBeVisible();
  }

  /** Fill account and address details supplied by the scenario.
   * @param {RegistrationDetails} details
   * @returns {Promise<void>}
   */
  async fillRegistrationDetails(details) {
    logger.info('Filling account registration form');
    if (details.title === 'Mr.') {
      await this.mrRadio.check();
    } else if (details.title === 'Mrs.') {
      await this.mrsRadio.check();
    }

    await this.passwordInput.fill(details.password);

    if (details.birthDate) {
      await this.daySelect.selectOption({ label: details.birthDate.day });
      await this.monthSelect.selectOption({ label: details.birthDate.month });
      await this.yearSelect.selectOption({ label: details.birthDate.year });
    }

    if (details.newsletter) {
      await this.newsletterCheckbox.check();
    }
    if (details.specialOffers) {
      await this.specialOffersCheckbox.check();
    }

    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    if (details.company) {
      await this.companyInput.fill(details.company);
    }
    await this.addressInput.fill(details.address);
    if (details.address2) {
      await this.address2Input.fill(details.address2);
    }
    if (details.country) {
      await this.countrySelect.selectOption({ label: details.country });
    }
    await this.stateInput.fill(details.state);
    await this.cityInput.fill(details.city);
    await this.zipcodeInput.fill(details.zipcode);
    await this.mobileNumberInput.fill(details.mobileNumber);
  }

  /** Submit the completed registration form.
   * @returns {Promise<void>}
   */
  async createAccount() {
    logger.info('Submitting account registration form');
    await this.createAccountButton.click();
  }
}
