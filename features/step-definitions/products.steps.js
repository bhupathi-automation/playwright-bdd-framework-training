import { Given, Then, When } from '@cucumber/cucumber';
import uiData from '../test-data/ui-data.json' with { type: 'json' };

Given('the user opens the products page', async function () {
  await this.productsPage.open();
});

Then('the product catalog is displayed', async function () {
  await this.productsPage.assertLoaded();
});

Then('the product categories from test data are displayed', async function () {
  await this.productsPage.assertCategoriesDisplayed(uiData.products.categories);
});

Then('the product brands from test data are displayed', async function () {
  await this.productsPage.assertBrandsDisplayed(uiData.products.brands);
});

When('the user searches for the matching product', async function () {
  await this.productsPage.search(uiData.products.matchingSearch);
});

When('the user searches for a non-matching product', async function () {
  await this.productsPage.search(uiData.products.nonMatchingSearch);
});

Then('the search results include the matching product', async function () {
  await this.productsPage.assertSearchResultsDisplayed();
  await this.productsPage.assertSearchResultContains(uiData.products.matchingSearch);
});

Then('no products are listed in the search results', async function () {
  await this.productsPage.assertSearchResultsDisplayed();
  await this.productsPage.assertSearchResultsAreEmpty();
});
