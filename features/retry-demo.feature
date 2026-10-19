@retry-demo
Feature: Cucumber scenario retry demonstration
  As an automation engineer
  I want retries to receive fresh scenario resources
  So that retrying does not reuse state from a failed attempt

  @ui
  Scenario: a retried UI attempt receives a fresh page and context
    Then the "ui" retry demonstration checks fresh scenario resources

  @api
  Scenario: a retried API attempt receives a fresh request context and client
    Then the "api" retry demonstration checks fresh scenario resources

  @integration
  Scenario: a retried integration attempt receives fresh UI and API resources
    Then the "integration" retry demonstration checks fresh scenario resources
