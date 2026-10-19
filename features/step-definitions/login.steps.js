import { Given, Then, When } from '@cucumber/cucumber';
import uiData from '../test-data/ui-data.json' with { type: 'json' };
import { getRequiredEnv } from '../../utils/commonUtils.js';
import 'dotenv/config';

Given('the user opens the login page', async function () {
  await this.loginPage.open();
});

Then('the login and signup forms are displayed', async function () {
  await this.loginPage.assertLoaded();
});

Then('login credentials are required', async function () {
  await this.loginPage.assertLoginCredentialsAreRequired();
});

When('the user submits unregistered account credentials', async function () {
  await this.loginPage.login(uiData.login.invalidEmail, uiData.login.invalidPassword);
});

Then('the login failure message is displayed', async function () {
  await this.loginPage.assertLoginFailed();
});

When('the user enters and submits valid email and valid password', async function () {
  const email = getRequiredEnv('VALID_EMAIL', 'UI login tests');
  const password = getRequiredEnv('VALID_PASSWORD', 'UI login tests');

  await this.loginPage.login(email, password);
});

When(
  'the user enters invalid email {string} and password {string} and submit login',
  async function (emailFromFeatureFile, password) {
    await this.loginPage.login(emailFromFeatureFile, password);
  },
);

Then('the user sees error message {string}', async function (errorMessage) {
  await this.loginPage.assertLoginFailedForInvalidCreds(errorMessage);
});
