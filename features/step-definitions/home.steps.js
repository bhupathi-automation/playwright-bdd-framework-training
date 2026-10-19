import { Given, Then, When } from '@cucumber/cucumber';
import { getRequiredEnv } from '../../utils/commonUtils.js';
import 'dotenv/config';

Given('the user opens the AutomationExercise home page', async function () {
  await this.homePage.open();
});

Then('the AutomationExercise home page is displayed', async function () {
  await this.homePage.assertLoaded();
});

Then('the primary navigation is displayed', async function () {
  await this.homePage.assertNavigationDisplayed();
});

When('the user selects Products from the home page', async function () {
  await this.homePage.openProducts();
});

When('the user selects the login page from the home page', async function () {
  await this.homePage.openLogin();
});

When('the user selects Cart from the home page', async function () {
  await this.homePage.openCart();
});

Then('verify the username is displayed on Home page', async function () {
  const username = getRequiredEnv('LOGIN_USERNAME', 'logged-in home-page verification');
  await this.homePage.assertLoggedInUser(username);
});
