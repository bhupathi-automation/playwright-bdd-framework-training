@ui @login
Feature: AutomationExercise login
    As a registered shopper
    I want to authenticate with my account
    So that I can access my account

    Scenario: Verify login forms are displayed and credentials are required
        Given the user opens the login page
        Then the login and signup forms are displayed
        And login credentials are required

    @login2
    Scenario: Verify an unregistered user cannot log in
        Given the user opens the login page
        When the user submits unregistered account credentials
        Then the login failure message is displayed

    @login3
    Scenario: verify successful login with valid credentials
        Given the user opens the login page
        When the user enters and submits valid email and valid password
        Then verify the username is displayed on Home page

    @login4
    Scenario Outline: verify error message for invalid login
        Given the user opens the login page
        When the user enters invalid email "<email>" and password "<password>" and submit login
        Then the user sees error message "Your email or password is incorrect!"
        Examples:
            | email                    | password        |
            | invalidemail_1@gmail.com | password123     |
            | invalidemail_2@gmail.com | password@#$%123 |
            | invalidemail_3@gmail.com | 1234567890      |


