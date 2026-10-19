@ui @cart
Feature: AutomationExercise shopping cart
  As a shopper
  I want to manage products in my cart
  So that I can review the items I plan to buy

  Scenario: Verify a new cart is empty
    Given the user opens an empty cart
    Then the cart page is displayed
    And the empty cart message is displayed

  Scenario: Verify a product is added to the cart with its requested quantity
    Given the user opens the details page for the configured cart product
    When the user adds the configured product to the cart
    Then the configured product is listed in the cart
    And the configured product quantity is displayed

  Scenario: Verify removing the last product returns the cart to empty
    Given the user opens the details page for the configured cart product
    When the user adds the configured product to the cart
    And the user removes the configured product from the cart
    Then the empty cart message is displayed