@ui @home @parallel
Feature: AutomationExercise home page
  As a shopper
  I want to open the AutomationExercise home page
  So that I can begin browsing products

@home1
  Scenario: Verify the home page and primary navigation are displayed
    Given the user opens the AutomationExercise home page
    Then the AutomationExercise home page is displayed
    And the primary navigation is displayed

  Scenario: Verify home navigation opens the product catalog
    Given the user opens the AutomationExercise home page
    When the user selects Products from the home page
    Then the product catalog is displayed

  Scenario: Verify home navigation opens the login page
    Given the user opens the AutomationExercise home page
    When the user selects the login page from the home page
    Then the login and signup forms are displayed

  Scenario: Verify home navigation opens the cart
    Given the user opens the AutomationExercise home page
    When the user selects Cart from the home page
    Then the cart page is displayed
