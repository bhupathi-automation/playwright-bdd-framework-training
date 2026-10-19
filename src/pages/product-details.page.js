import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/**
 * Page Object for product information and add-to-cart actions.
 */
export class ProductDetailsPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.productInformation = page.locator('.product-information');
    this.productNameHeading = this.productInformation.getByRole('heading', { level: 2 });
    this.productPrice = this.productInformation.locator('span > span').first();
    this.productMetadata = this.productInformation.locator('p');
    this.quantityInput = page.getByRole('spinbutton');
    this.addToCartButton = page.getByRole('button', { name: /Add to cart/ });
    this.addedHeading = page.getByRole('heading', { name: 'Added!', exact: true });
    this.viewCartLink = page.getByRole('link', { name: 'View Cart', exact: true });
    this.reviewForm = page.locator('#review-form');
    this.reviewNameInput = this.reviewForm.locator('#name');
    this.reviewEmailInput = this.reviewForm.locator('#email');
    this.reviewTextInput = this.reviewForm.locator('#review');
    this.reviewSubmitButton = this.reviewForm.getByRole('button', { name: 'Submit', exact: true });
    this.reviewConfirmation = page.locator('#review-section .alert-success');
  }

  /** Open a product details page by its application product ID.
   * @param {string|number} productId
   * @returns {Promise<void>}
   */
  async open(productId) {
    logger.info('Opening product details page');
    await this.page.goto(`/product_details/${productId}`);
  }

  /** Set the requested product quantity.
   * @param {number} quantity
   * @returns {Promise<void>}
   */
  async setQuantity(quantity) {
    await this.quantityInput.fill(String(quantity));
  }

  /** Verify the requested product quantity is displayed in the input.
   * @param {number} quantity
   * @returns {Promise<void>}
   */
  async assertQuantity(quantity) {
    await expect(this.quantityInput).toHaveValue(String(quantity));
  }

  /** Add the displayed product to the cart.
   * @returns {Promise<void>}
   */
  async addToCart() {
    logger.info('Adding product to cart');
    await this.addToCartButton.click();
  }

  /** Verify the application confirms that the product was added.
   * @returns {Promise<void>}
   */
  async assertAddedToCart() {
    await expect(this.addedHeading).toBeVisible();
    await expect(this.page.getByText('Your product has been added to cart.')).toBeVisible();
  }

  /** Open the cart from the add-to-cart confirmation.
   * @returns {Promise<void>}
   */
  async openCartFromConfirmation() {
    logger.info('Opening cart from add-to-cart confirmation');
    await this.viewCartLink.click();
  }

  /** Verify that product information is displayed.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.page).toHaveURL(/\/product_details\/\d+$/);
    await expect(this.productNameHeading).toBeVisible();
  }

  /** Verify the displayed product name.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async assertProductName(productName) {
    await expect(this.productNameHeading).toHaveText(productName);
  }

  /** Verify the product name and its displayed catalog details.
   * @param {{name: string, category: string, price: string, availability: string, condition: string, brand: string}} product
   * @returns {Promise<void>}
   */
  async assertProductDetails(product) {
    await expect(this.productNameHeading).toHaveText(product.name);
    await expect(
      this.productInformation.getByText(product.category, { exact: true }),
    ).toBeVisible();
    await expect(this.productPrice).toHaveText(product.price);
    for (const detail of [product.availability, product.condition, product.brand]) {
      await expect(this.productMetadata.getByText(detail, { exact: true })).toBeVisible();
    }
  }

  /** Verify the required review inputs and submit button are displayed.
   * @returns {Promise<void>}
   */
  async assertReviewFormDisplayed() {
    for (const input of [this.reviewNameInput, this.reviewEmailInput, this.reviewTextInput]) {
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('required', '');
    }
    await expect(this.reviewSubmitButton).toBeVisible();
  }

  /** Submit a review for the displayed product.
   * @param {string} name
   * @param {string} email
   * @param {string} review
   * @returns {Promise<void>}
   */
  async submitReview(name, email, review) {
    await this.reviewNameInput.fill(name);
    await this.reviewEmailInput.fill(email);
    await this.reviewTextInput.fill(review);
    await this.reviewSubmitButton.scrollIntoViewIfNeeded();
    await this.reviewSubmitButton.click();
  }

  /** Verify that the application confirms a submitted review.
   * @returns {Promise<void>}
   */
  async assertReviewSubmitted() {
    await expect(this.reviewConfirmation).toHaveText('Thank you for your review.');
  }
}
