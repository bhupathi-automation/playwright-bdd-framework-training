import { Given, Then, When } from '@cucumber/cucumber';
import uiData from '../test-data/ui-data.json' with { type: 'json' };

Given('the user opens an empty cart', async function () {
  await this.cartPage.open();
});

Then('the cart page is displayed', async function () {
  await this.cartPage.assertLoaded();
});

Then('the empty cart message is displayed', async function () {
  await this.cartPage.assertEmpty();
});

Given('the user opens the details page for the configured cart product', async function () {
  await this.productsPage.open();
  await this.productsPage.openProduct(uiData.products.cartProductName);
  await this.productDetailsPage.assertLoaded();
  await this.productDetailsPage.assertProductName(uiData.products.cartProductName);
});

When('the user adds the configured product to the cart', async function () {
  await this.productDetailsPage.setQuantity(uiData.products.cartQuantity);
  await this.productDetailsPage.addToCart();
  await this.productDetailsPage.assertAddedToCart();
  await this.productDetailsPage.openCartFromConfirmation();
});

Then('the configured product is listed in the cart', async function () {
  await this.cartPage.assertProductIsPresent(uiData.products.cartProductName);
});

Then('the configured product quantity is displayed', async function () {
  await this.cartPage.assertProductQuantity(
    uiData.products.cartProductName,
    uiData.products.cartQuantity,
  );
});

When('the user removes the configured product from the cart', async function () {
  await this.cartPage.removeProduct(uiData.products.cartProductName);
});
