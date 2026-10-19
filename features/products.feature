@ui @products
Feature: AutomationExercise product catalog
  As a shopper
  I want to browse the product catalog
  So that I can find products to buy

  Scenario: Verify the product catalog opens
    Given the user opens the products page
    Then the product catalog is displayed

  Scenario: Verify product categories and brands are displayed
    Given the user opens the products page
    Then the product categories from test data are displayed
    And the product brands from test data are displayed

  Scenario: Verify a matching product appears in search results
    Given the user opens the products page
    When the user searches for the matching product
    Then the search results include the matching product

  Scenario: Verify a non-matching product returns no search results
    Given the user opens the products page
    When the user searches for a non-matching product
    Then no products are listed in the search results