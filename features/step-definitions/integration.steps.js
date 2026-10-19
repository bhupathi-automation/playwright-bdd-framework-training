import { Then, When } from '@cucumber/cucumber';
import { requireApiAccount } from '../../utils/commonUtils.js';

When('the user logs in with the API-created account', async function () {
  const account = requireApiAccount(this);

  await this.loginPage.login(account.email, account.password);
});

Then('the API-created account is shown as logged in', async function () {
  const account = requireApiAccount(this);

  await this.homePage.assertLoggedInUser(account.name);
});
