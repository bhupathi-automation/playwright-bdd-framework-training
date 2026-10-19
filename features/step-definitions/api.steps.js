import { Given, Then, When } from '@cucumber/cucumber';
import apiData from '../test-data/api-data.json' with { type: 'json' };
import apiEndpoints from '../test-data/api-endpoints.json' with { type: 'json' };
import { getRequiredEnv, requireApiAccount } from '../../utils/commonUtils.js';
import { createUniqueApiAccount } from '../../utils/testData.js';

/**
 * Return the configured account used by the login verification scenario.
 * Values are read from the local environment and are never written to reports.
 *
 * @returns {{email: string, password: string}}
 */
function getValidCredentials() {
  return {
    email: getRequiredEnv('VALID_EMAIL', 'API login verification'),
    password: getRequiredEnv('VALID_PASSWORD', 'API login verification'),
  };
}

/**
 * Build account form data from the shared JSON fixture and a unique email.
 *
 * @param {import('../support/world.js').CustomWorld} world Current scenario World.
 * @returns {void}
 */
function prepareUniqueAccount(world) {
  world.apiTestAccount = createUniqueApiAccount(
    getRequiredEnv('VALID_PASSWORD', 'account API tests'), //Get the password from .env
  );
}

/**
 * Send a create-account request and remember the account for scenario cleanup.
 *
 * @param {import('../support/world.js').CustomWorld} world Current scenario World.
 * @returns {Promise<void>}
 */
async function createUniqueAccount(world) {
  if (!world.apiTestAccount) {
    prepareUniqueAccount(world);
  }

  // Create User account API --> Endpoint, accountCreation request payload
  world.apiResponse = await world.apiClient.post(apiEndpoints.createAccount, {
    form: world.apiTestAccount,
  });
  world.apiClient.validateStatus(world.apiResponse, 200);
  world.apiResponseBody = await world.apiResponse.json();
  world.apiClient.validateResponseCode(world.apiResponseBody, 201);
  world.apiClient.validateMessage(world.apiResponseBody, 'User created!');
  world.apiTestAccountCreated = true;
}

/**
 * Parse and store the current API response body for the following assertion.
 *
 * @param {import('../support/world.js').CustomWorld} world Current scenario World.
 * @returns {Promise<Record<string, unknown>>}
 */
async function readApiResponseBody(world) {
  if (!world.apiResponse) {
    throw new Error('No API response is available to validate.');
  }

  world.apiResponseBody = await world.apiResponse.json();
  return world.apiResponseBody;
}

When('the user requests the products list from the API', async function () {
  this.apiResponse = await this.apiClient.get(apiEndpoints.productsList);
});

When('the user searches products for {string} using the API', async function (searchTerm) {
  this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
    form: { search_product: searchTerm },
  });
});

When('the user searches products without a search term using the API', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
    form: {},
  });
});

When('the user verifies login with valid API credentials', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.verifyLogin, {
    form: getValidCredentials(),
  });
});

When('the user verifies login with invalid API credentials', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.verifyLogin, {
    form: {
      email: apiData.login.invalidEmail,
      password: apiData.login.invalidPassword,
    },
  });
});

When('the user verifies login without credentials', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.verifyLogin, {
    form: {},
  });
});

Given('the user has unique account details for the API', function () {
  prepareUniqueAccount(this);
});

Given('a unique API account has been created', async function () {
  prepareUniqueAccount(this);
  await createUniqueAccount(this);
});

When('the user creates an account using the API', async function () {
  await createUniqueAccount(this);
});

When('the user creates the same account again using the API', async function () {
  const account = requireApiAccount(this);
  this.apiResponse = await this.apiClient.post(apiEndpoints.createAccount, {
    form: account,
  });
});

When('the user updates the current API account name to {string}', async function (name) {
  const account = requireApiAccount(this);
  this.apiTestAccount = { ...account, name };
  this.apiResponse = await this.apiClient.put(apiEndpoints.updateAccount, {
    form: this.apiTestAccount,
  });
});

When('the user requests details for the current API account', async function () {
  const account = requireApiAccount(this);
  this.apiResponse = await this.apiClient.get(apiEndpoints.getUserDetailByEmail, {
    params: { email: account.email },
  });
});

When('the user requests details for an unknown API account', async function () {
  this.apiResponse = await this.apiClient.get(apiEndpoints.getUserDetailByEmail, {
    params: { email: apiData.login.invalidEmail },
  });
});

When('the user deletes the current API account', async function () {
  const account = requireApiAccount(this);
  this.apiResponse = await this.apiClient.delete(apiEndpoints.deleteAccount, {
    form: {
      email: account.email,
      password: account.password,
    },
  });
});

Then('the API HTTP status is {int}', function (expectedStatus) {
  this.apiClient.validateStatus(this.apiResponse, expectedStatus);
});

Then('the API response code is {int}', async function (expectedCode) {
  this.apiClient.validateResponseCode(await readApiResponseBody(this), expectedCode);
});

Then('the API response message is {string}', async function (expectedMessage) {
  this.apiClient.validateMessage(await readApiResponseBody(this), expectedMessage);
});

Then('the API response contains products', async function () {
  this.apiClient.validateProducts(await readApiResponseBody(this));
});

Then('the API response contains the product {string}', async function (productName) {
  this.apiClient.validateProducts(await readApiResponseBody(this), productName);
});

Then('the API response contains no products', async function () {
  this.apiClient.validateNoProducts(await readApiResponseBody(this));
});

Then('the API response contains the current account details', async function () {
  const account = requireApiAccount(this);
  this.apiClient.validateUserDetails(await readApiResponseBody(this), {
    email: account.email,
    name: account.name,
  });
});

Then('the deleted account cannot be retrieved', async function () {
  const account = requireApiAccount(this);
  const deleteResponseBody = await readApiResponseBody(this);
  this.apiClient.validateResponseCode(deleteResponseBody, 200);
  this.apiClient.validateMessage(deleteResponseBody, 'Account deleted!');
  this.apiTestAccountDeleted = true;

  this.apiResponse = await this.apiClient.get(apiEndpoints.getUserDetailByEmail, {
    params: { email: account.email },
  });
  this.apiClient.validateStatus(this.apiResponse, 200);
  const lookupResponseBody = await readApiResponseBody(this);
  this.apiClient.validateResponseCode(lookupResponseBody, 404);
  this.apiClient.validateMessage(lookupResponseBody, 'User not found!');
});
