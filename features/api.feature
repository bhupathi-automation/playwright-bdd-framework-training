@api
Feature: AutomationExercise API
  As an automation engineer
  I want to verify documented ecommerce API behavior
  So that product and account operations work as expected

  @parallel
  Scenario: verify the product list API returns products
    When the user requests the products list from the API
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response contains products

  @parallel
  Scenario: verify product search returns the matching product
    When the user searches products for "Blue Top" using the API
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response contains the product "Blue Top"

  Scenario: validate product search returns no products for an unmatched term
    When the user searches products for "no-such-product-xyz" using the API
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response contains no products

  Scenario: validate product search rejects a missing search term
    When the user searches products without a search term using the API
    Then the API HTTP status is 200
    And the API response code is 400
    And the API response message is "Bad request, search_product parameter is missing in POST request."

  Scenario: verify login succeeds with valid credentials from the environment
    When the user verifies login with valid API credentials
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response message is "User exists!"

  Scenario: validate login rejects invalid credentials
    When the user verifies login with invalid API credentials
    Then the API HTTP status is 200
    And the API response code is 404
    And the API response message is "User not found!"

  Scenario: validate login rejects missing credentials
    When the user verifies login without credentials
    Then the API HTTP status is 200
    And the API response code is 400
    And the API response message is "Bad request, email or password parameter is missing in POST request."

  Scenario: verify a new user account can be created
    Given the user has unique account details for the API
    When the user creates an account using the API
    Then the API HTTP status is 200
    And the API response code is 201
    And the API response message is "User created!"

  Scenario: validate account creation rejects a duplicate email address
    Given a unique API account has been created
    When the user creates the same account again using the API
    Then the API HTTP status is 200
    And the API response code is 400
    And the API response message is "Email already exists!"

  Scenario: verify an existing user account can be updated
    Given a unique API account has been created
    When the user updates the current API account name to "Updated API Test User"
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response message is "User updated!"
    When the user requests details for the current API account
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response contains the current account details

  Scenario: verify details for an existing user account can be retrieved
    Given a unique API account has been created
    When the user requests details for the current API account
    Then the API HTTP status is 200
    And the API response code is 200
    And the API response contains the current account details

  Scenario: validate user details lookup reports an unknown email
    When the user requests details for an unknown API account
    Then the API HTTP status is 200
    And the API response code is 404
    And the API response message is "User not found!"

  Scenario: verify an existing user account can be deleted
    Given a unique API account has been created
    When the user deletes the current API account
    Then the API HTTP status is 200
    And the deleted account cannot be retrieved
