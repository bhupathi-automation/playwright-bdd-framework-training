import { expect } from 'playwright/test';
import logger from '../../utils/logger.js';

/**
 * Page Object for the shopping cart page.
 */
export class CartPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.emptyCartMessage = page.getByText(/Cart is empty!/);
    this.cartRows = page.locator('#cart_info_table tbody tr');
    this.checkoutLink = page.getByRole('link', { name: /Proceed To Checkout/ });
  }

  /** Open the shopping cart.
   * @returns {Promise<void>}
   */
  async open() {
    logger.info('Opening cart page');
    await this.page.goto('/view_cart');
  }

  /** Verify that the cart route is displayed.
   * @returns {Promise<void>}
   */
  async assertLoaded() {
    await expect(this.page).toHaveURL(/\/view_cart$/);
  }

  /** Verify that the cart contains a product with the supplied name.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async assertProductIsPresent(productName) {
    await expect(this.cartRows.filter({ hasText: productName })).toBeVisible();
  }

  /** Verify the quantity shown for a product in the cart.
   * @param {string} productName
   * @param {number} quantity
   * @returns {Promise<void>}
   */
  async assertProductQuantity(productName, quantity) {
    const productRow = this.cartRows.filter({ hasText: productName });
    await expect(productRow.getByRole('button')).toHaveText(String(quantity));
  }

  /** Remove a product from the cart.
   * @param {string} productName
   * @returns {Promise<void>}
   */
  async removeProduct(productName) {
    logger.info('Removing a product from the cart');
    const productRow = this.cartRows.filter({ hasText: productName });
    await productRow.locator('.cart_quantity_delete').click();
    await expect(productRow).toHaveCount(0);
  }

  /** Verify the empty-cart state.
   * @returns {Promise<void>}
   */
  async assertEmpty() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /** Continue from the cart to checkout.
   * @returns {Promise<void>}
   */
  async proceedToCheckout() {
    logger.info('Proceeding to checkout');
    await this.checkoutLink.click();
  }
}
