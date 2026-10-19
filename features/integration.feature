@integration
Feature: AutomationExercise UI and API integration
  As an automation engineer
  I want to create an account through the API and use it in the UI
  So that account creation, login, and deletion work together

  Scenario: create an account by API, log in through the UI, and delete it by API
    #Creation of a new user account by API
    Given a unique API account has been created

    #Login functionality validation via UI using API created account
    When the user opens the login page
    And the user logs in with the API-created account
    Then the API-created account is shown as logged in
    
    #Delete the created account using Delete API
    When the user deletes the current API account
    Then the deleted account cannot be retrieved
