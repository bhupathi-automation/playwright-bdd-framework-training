import { Given, Then, When } from '@cucumber/cucumber';
import uiData from '../test-data/ui-data.json' with { type: 'json' };

Given('the user opens the details page for the configured product', async function () {
  await this.productsPage.open();
  await this.productsPage.openProduct(uiData.products.productDetails.name);
  await this.productDetailsPage.assertLoaded();
});

Then('the configured product details are displayed', async function () {
  await this.productDetailsPage.assertProductDetails(uiData.products.productDetails);
});

When('the user changes the product quantity to {int}', async function (quantity) {
  await this.productDetailsPage.setQuantity(quantity);
});

Then('the product quantity is {int}', async function (quantity) {
  await this.productDetailsPage.assertQuantity(quantity);
});

When('the user adds the product to the cart from the product details page', async function () {
  await this.productDetailsPage.addToCart();
});

Then('the add-to-cart confirmation is displayed', async function () {
  await this.productDetailsPage.assertAddedToCart();
});

When('the user opens the cart from the product details confirmation', async function () {
  await this.productDetailsPage.openCartFromConfirmation();
});

Then('the review form fields are displayed', async function () {
  await this.productDetailsPage.assertReviewFormDisplayed();
});

When(
  'the user submits a review with name {string}, email {string}, and comment {string}',
  async function (name, email, comment) {
    await this.productDetailsPage.submitReview(name, email, comment);
  },
);

Then('the review submission confirmation is displayed', async function () {
  await this.productDetailsPage.assertReviewSubmitted();
});
