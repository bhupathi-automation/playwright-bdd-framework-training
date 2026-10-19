import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/** Page Object for product search and catalog selection. */
export class ProductsPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.catalogHeading = page.getByRole('heading', { name: 'All Products', exact: true });
    this.searchInput = page.getByRole('textbox', { name: 'Search Product' });
    this.searchSubmitButton = page.locator('#submit_search');
    this.searchedProductsHeading = page.getByRole('heading', {
      name: 'Searched Products',
      exact: true,
    });
    this.productCards = page.locator('.product-image-wrapper');
    this.categoryLinks = page.locator('#accordian .panel-title > a');
    this.brandLinks = page.locator('.brands_products .brands-name a');
  }

  /** Open the product catalog directly.
   * @returns {Promise<void>}
   */
  async open() {
    logger.info('Opening product catalog');
    await this.page.goto('/products');
  }

  /** Search the catalog by product name.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async search(productName) {
    logger.info('Searching product catalog');
    await this.searchInput.fill(productName);
    await this.searchSubmitButton.click();
  }

  /** Open a product's details from its catalog entry.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async openProduct(productName) {
    logger.info('Opening a product from catalog results');
    const productCard = this.productCards.filter({ hasText: productName });
    await productCard.getByRole('link', { name: /View Product/ }).click();
  }

  /** Read the top-level product category names.
   * @returns {Promise<string[]>}
   */
  async getCategories() {
    const categoryNames = await this.categoryLinks.allTextContents();
    return categoryNames.map((name) => name.trim()).filter(Boolean);
  }

  /** Read the brand names without their displayed product counts.
   * @returns {Promise<string[]>}
   */
  async getBrands() {
    const brandNames = await this.brandLinks.allTextContents();
    return brandNames
      .map((name) =>
        name
          .trim()
          .replace(/^\(\d+\)\s*/, '')
          .trim(),
      )
      .filter(Boolean);
  }

  /** Expand a top-level product category.
   * @param {string} categoryName
   * @returns {Promise<void>}
   */
  async expandCategory(categoryName) {
    await this.categoryLinks.filter({ hasText: categoryName }).click();
  }

  /** Open the product listing for a brand.
   * @param {string} brandName
   * @returns {Promise<void>}
   */
  async selectBrand(brandName) {
    await this.brandLinks.filter({ hasText: brandName }).click();
  }

  /** Verify the category names currently displayed in the sidebar.
   * @param {string[]} expectedCategories
   * @returns {Promise<void>}
   */
  async assertCategoriesDisplayed(expectedCategories) {
    await expect.poll(() => this.getCategories()).toEqual(expectedCategories);
  }

  /** Verify the brand names currently displayed in the sidebar.
   * @param {string[]} expectedBrands
   * @returns {Promise<void>}
   */
  async assertBrandsDisplayed(expectedBrands) {
    await expect.poll(() => this.getBrands()).toEqual(expectedBrands);
  }

  /** Verify that the catalog is displayed.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.page).toHaveURL(/\/products$/);
    await expect(this.catalogHeading).toBeVisible();
  }

  /** Verify that search results are displayed.
   * @returns {Promise<void>}
   */
  async assertSearchResultsDisplayed() {
    await expect(this.searchedProductsHeading).toBeVisible();
  }

  /** Verify that a matching product is present in the search results.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async assertSearchResultContains(productName) {
    await expect(this.productCards.filter({ hasText: productName })).toHaveCount(1);
  }

  /** Verify that a search returns no products.
   * @returns {Promise<void>}
   */
  async assertSearchResultsAreEmpty() {
    await expect(this.productCards).toHaveCount(0);
  }
}
