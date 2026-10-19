@ui @product-details
Feature: AutomationExercise product details
  As a shopper
  I want to inspect a product and interact with its details
  So that I can make an informed purchase and share a review

  Scenario: Verify product details are displayed correctly
    Given the user opens the details page for the configured product
    Then the configured product details are displayed

  Scenario: Verify the product quantity can be modified
    Given the user opens the details page for the configured product
    When the user changes the product quantity to 5
    Then the product quantity is 5

  Scenario: Verify the add-to-cart button adds the requested quantity
    Given the user opens the details page for the configured product
    When the user changes the product quantity to 2
    And the user adds the product to the cart from the product details page
    Then the add-to-cart confirmation is displayed
    When the user opens the cart from the product details confirmation
    Then the configured product is listed in the cart
    And the configured product quantity is displayed

  Scenario: Verify the review form fields are displayed
    Given the user opens the details page for the configured product
    Then the review form fields are displayed

  Scenario Outline: Verify a product review is submitted successfully
    Given the user opens the details page for the configured product
    When the user submits a review with name "<name>", email "<email>", and comment "<comment>"
    Then the review submission confirmation is displayed

    Examples:
      | name                   | email                              | comment                                         |
      | AutomationExercise QA  | automation-review@example.com      | Product details review submission verification |
