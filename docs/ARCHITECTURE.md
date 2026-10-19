# Playwright BDD Framework Architecture

## 1. Purpose and Scope

This framework automates the [AutomationExercise](https://automationexercise.com/) ecommerce application using:

- JavaScript on Node.js
- Cucumber.js as the only test runner
- Playwright for browser and API capabilities
- Page Object Model for UI workflows
- A custom Cucumber World for scenario state
- JSDoc for type information and editor support
- ESLint and Prettier for code quality
- Cucumber HTML and Allure for reporting
- GitHub Actions for continuous integration

The design intentionally supports one QA environment and keeps the object flow visible to beginners.

### Explicitly excluded

This framework does not contain:

- A Playwright Test runner setup
- A fixtures layer
- A services layer
- A schemas layer
- Multiple environment configuration files
- Generic base page or base service classes unless a later, concrete duplication problem justifies one

## 2. Design Principles

1. Cucumber.js owns test execution, hooks, retries, and scenario lifecycle.
2. Hooks create objects; step definitions use them.
3. The World owns scenario state, not application behavior.
4. Page Objects own UI actions and UI-focused checks.
5. The API client owns HTTP request construction and response handling.
6. Step definitions translate Gherkin into calls to framework objects.
7. Test data is explicit and easy to locate.
8. Each UI scenario receives a new browser, context, and page.
9. Selectors and assertions should describe user-visible behavior.
10. The smallest useful abstraction is preferred.
11. `BROWSER` selects Chromium, Firefox, or WebKit without changing Page Objects or feature files.

## 3. Proposed Folder Structure

```text
playwright-bdd-framework-training/
|
+-- .github/
|   +-- workflows/
|       +-- cross-browser.yml
|
+-- config/
|   +-- config.js                   # Single QA environment configuration
|
+-- docs/
|   +-- ARCHITECTURE.md
|
+-- features/
|   +-- auth.feature
|   +-- products.feature
|   +-- api.feature
|   +-- step-definitions/
|       +-- auth.steps.js
|       +-- products.steps.js
|       +-- api.steps.js
|
+-- src/
|   +-- world/
|   |   +-- custom-world.js
|   |
|   +-- hooks/
|   |   +-- cucumber-hooks.js
|   |
|   +-- pages/
|   |   +-- home.page.js
|   |   +-- login.page.js
|   |   +-- products.page.js
|   |   +-- cart.page.js
|   |   +-- checkout.page.js
|   |
|   +-- api/
|   |   +-- api-client.js
|   |
|   +-- utils/
|       +-- test-data.js
|       +-- assertions.js          # Only if repeated domain assertions emerge
|       +-- file-utils.js          # Only for shared evidence/reporting helpers
|
+-- artifacts/
|   +-- reports/
|   |   +-- cucumber/
|   |   +-- allure-results/
|   |   +-- allure-report/
|   +-- screenshots/
|   +-- traces/
|   +-- videos/
|   +-- logs/
+-- package.json
+-- eslint.config.js
+-- .prettierrc
+-- .gitignore
+-- README.md
```

`utils` should begin small. A utility is added only when the same framework-neutral operation is repeated and a named helper makes the test easier to read.

## 4. Component Responsibility Matrix

| Component        | Owns                                                                                                                    | Does not own                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Custom World     | Scenario-scoped references: context, page, page objects, API client, response data, test data, and error/evidence state | Browser lifecycle decisions, locator details, or business workflows |
| Before hook      | Browser context, page, required Page Objects, and API client creation; storing them in World                            | Scenario assertions or feature-specific actions                     |
| After hook       | Failure screenshot, configured trace and optional video handling; context closure; required scenario cleanup            | Business logic and result interpretation                            |
| Page Object      | Locators, UI actions, and focused UI state checks for one page or cohesive page area                                    | Cross-scenario state and API request details                        |
| API client       | Base URL handling, request methods, common headers, and response return values                                          | Browser actions, Gherkin wording, and domain-wide workflows         |
| Step definitions | Gherkin-to-object translation, test intent, and small orchestration                                                     | Raw locator work, browser creation, or low-level HTTP construction  |
| Utilities        | Small reusable framework-neutral operations such as test data creation or evidence naming                               | Hidden scenario state and large business workflows                  |
| Feature files    | Business-readable behavior, examples, and acceptance intent                                                             | Implementation details and CSS/XPath selectors                      |
| Configuration    | The single QA base URL and stable runtime settings                                                                      | Per-scenario mutable state and secret values committed to source    |
| Reporters        | Human-readable scenario results, attachments, and diagnostics                                                           | Test execution or application behavior                              |

## 5. Object Initialization and Data Flow

### Before hook flow

1. Cucumber starts a scenario and creates a new Custom World instance.
2. The Before hook reads the single QA configuration.
3. The hook creates a new Playwright browser context.
4. The hook creates a new page from that context.
5. The hook creates only the Page Objects needed by the framework. They receive the page they operate on.
6. The hook creates the API client for `@api` and `@integration` scenarios. It receives the QA API base URL and request context.
7. The hook stores all created references on the World.
8. The step definitions access those references through `this` and call the appropriate Page Object or API client method.

An `@integration` scenario receives both browser and API resources. For account integration, the API
step creates a unique account and stores its email and password on the scenario World. A following
UI step reads those values from the same World and logs in using the existing LoginPage. The existing
HomePage checks the visible logged-in username, and an API delete followed by an API account lookup
verifies deletion. If a scenario fails before its explicit delete, the `After` hook removes its
created account as a cleanup safeguard. No credentials are shared with another scenario.

### Scenario data flow

```text
Feature step
    -> Step definition
        -> World reference
            -> Page Object or API client
                -> Playwright page or APIRequestContext
                    -> AutomationExercise
                <- UI state or API response
            <- Business-readable result
        <- Cucumber assertion
    -> Cucumber report
```

Step definitions may store response data or generated test values on the World when a later step needs them. This keeps data scoped to the scenario and avoids global variables.

### After hook flow

1. Cucumber provides the scenario result to the After hook.
2. If the scenario failed, the hook captures and attaches a screenshot. Trace capture is optional and starts only when configured. Video recording is opt-in and successful videos are discarded.
3. The hook performs required scenario cleanup, such as removing test data if the application supports it.
4. The hook closes the browser context. Closing the context also releases its pages.
5. The hook closes the scenario's browser; API request contexts are disposed during cleanup.

## 6. Scenario Isolation

- Every scenario gets a new World instance.
- Every UI scenario gets a new browser, context, page, and Page Object instances; API-only scenarios create only the API resources they need.
- Cookies, local storage, permissions, and other browser state do not cross scenario boundaries.
- API request context state is created per scenario when API scenarios need isolated headers or storage.
- Mutable response values, IDs, and generated data are stored on the current World only.
- No module-level variables may hold scenario state.
- Scenarios should create or select their own test data and must not depend on execution order.
- Cleanup belongs in the After hook only when the application supports a reliable cleanup action.
- Cucumber.js can run scenarios in parallel with `--parallel <workers>`; this does not use Playwright Test workers or change scenario lifecycle.
- Each scenario owns its browser instance, so Cucumber workers do not share mutable browser state.
- UI scenario reports include the selected browser as an attachment.
- Screenshot, trace, and retained video filenames include a unique scenario ID so simultaneous failures cannot overwrite one another.
- Keep the worker count low enough for the shared QA environment and local browser resources.

Isolation protects against browser-state leakage, but it cannot prevent two scenarios from changing the same server-side account or product. Those scenarios need unique data or controlled sequencing.

## 7. Page Object Model Standards

Each Page Object represents one navigable page or cohesive page area. It should expose intent-based methods such as logging in, searching for a product, adding a product to the cart, or reading a product name. It should not expose selector strings to step definitions.

Page Objects should:

- Receive a Playwright Page through their constructor.
- Keep locators private to the Page Object where practical.
- Use stable user-facing locators first: role, label, text, and test ID when available.
- Use CSS selectors only when a stable semantic locator is unavailable.
- Avoid XPath unless no maintainable alternative exists.
- Wait through Playwright locator actions and assertions instead of arbitrary timeouts.
- Return only values that a later step genuinely needs.
- Keep assertions focused on the page state they own.

A Page Object should not contain API calls, Cucumber-specific code, or scenario setup.

## 8. API Client Standards

`src/api/api-client.js` is a small reusable wrapper around Playwright `APIRequestContext`.

It should:

- Accept the single QA API base URL and request context.
- Provide straightforward methods for the API endpoints used by features.
- Centralize common headers and request options.
- Return the response or a small response representation needed by steps.
- Leave business assertions to step definitions or focused assertion helpers.
- Provide useful error context when a request fails.

The API client is not a services layer. It should remain a thin HTTP client. Do not create one class per endpoint unless the API surface becomes large enough to make the single client unreadable.

## 9. Hooks and Custom World

### Custom World

The World is the typed scenario context. JSDoc should describe optional properties because different scenarios may initialize different objects. Typical properties include:

- Browser context and page
- Page Object references
- API client
- Last API response or parsed response data
- Generated user or product data
- Evidence-related metadata

The World should be easy to inspect while debugging. It must not become a general-purpose application container.

### Hooks

The Before hook is the composition root for scenario objects. It creates objects in a predictable order and stores them on the World. The After hook is responsible for evidence and resource cleanup. The current setup has no `BeforeAll` or `AfterAll` hooks: browser lifecycle is scenario-scoped, and Cucumber invokes these hooks for each scenario in its worker. Keep feature-specific hooks rare; prefer tags only when a scenario truly needs different setup or evidence behavior.

## 10. Locator and Assertion Standards

### Locator priority

1. Accessible role and accessible name
2. Label or placeholder
3. Stable `data-testid` or equivalent test attribute
4. Visible text for stable user-facing content
5. CSS selector based on a stable attribute
6. XPath only as a last resort

Do not use generated class names, positional selectors, or long selector chains when a stable alternative exists.

### Assertion standards

- Assert observable outcomes, not implementation details.
- Prefer Playwright web-first assertions because they wait for the expected state.
- Assert one meaningful outcome per step where practical.
- Include useful expected values in failure messages when a custom assertion is necessary.
- Use API status and response-body assertions for API scenarios.
- Do not use arbitrary sleeps to make assertions pass.
- Keep assertions close to the step that expresses the behavior, while page-specific state access remains in the Page Object.

## 11. Coding Standards

- Use modern JavaScript supported by the selected Node.js version.
- Use JSDoc for World properties, constructor parameters, return values, API response shapes, and non-obvious data objects.
- Use `const` by default and `let` only for reassignment.
- Prefer `async`/`await` for Playwright and Cucumber operations.
- Avoid callbacks when a promise-based API is available.
- Keep functions small and named after intent.
- Use explicit error messages for setup and API failures.
- Do not hide waits, retries, or assertions inside generic helpers.
- Keep feature steps readable and business-oriented.
- Run ESLint and Prettier in local development and CI.
- Keep generated reports and screenshots out of source control.
- Do not commit credentials. Use GitHub Actions secrets or environment variables for sensitive runtime values, while retaining one QA environment definition.

## 12. Naming Conventions

- Feature files: `lower-kebab-case.feature`, for example `user-login.feature`.
- Step files: `<domain>.steps.js`, for example `login.steps.js`.
- Page Objects: `<page>.page.js`, with a class named `<Page>Page`, for example `LoginPage`.
- API client: `api-client.js`, with a class named `ApiClient`.
- World: `custom-world.js`, with a class named `CustomWorld`.
- Hooks: `cucumber-hooks.js`.
- Functions and variables: `camelCase`.
- Classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- Tags: lowercase, short, and meaningful, such as `@ui`, `@api`, or `@smoke`.
- Test data keys should describe business meaning, not control flow.

## 13. Reporting and CI

Cucumber.js remains the test runner, including when scenarios run in parallel. Cucumber's formatters
consume the worker messages into one run report; Allure emits uniquely identified scenario results.
The reporting setup may produce:

- Cucumber HTML output for readable scenario results.
- Allure results and an Allure report for history, attachments, and trend analysis.
- Screenshots attached on failure; traces only when deliberately enabled.

GitHub Actions should run the same package scripts used locally, in this order:

1. Install dependencies with a locked dependency file.
2. Install the required Playwright browser.
3. Run formatting and lint checks.
4. Run Cucumber scenarios against the single QA environment.
5. Publish Cucumber, Allure, screenshots, and other diagnostics as artifacts even when tests fail.

CI should fail on test or quality-check failure while preserving reports for diagnosis.

## 14. Development Roadmap

### Phase 1: Project foundation

- Initialize Node.js project and package scripts.
- Add Cucumber.js, Playwright, ESLint, Prettier, and reporting dependencies.
- Establish the single QA configuration.
- Add `.gitignore`, README, and basic CI workflow.

### Phase 2: Framework core

- Define Custom World with JSDoc.
- Implement Before and After hook responsibilities.
- Validate context, page, evidence, and cleanup behavior with one small scenario.

### Phase 3: UI automation

- Add the first Page Object for the home or login flow.
- Add one feature and step definition set.
- Standardize locator and assertion patterns.
- Add failure screenshot attachment.

### Phase 4: API automation

- Add the thin API client using `APIRequestContext`.
- Add one API feature covering a meaningful endpoint and response assertion.
- Store only required API results on World.

### Phase 5: Reporting and quality gates

- Configure Cucumber HTML and Allure outputs.
- Add ESLint and Prettier scripts.
- Add CI artifact publication and verify failure diagnostics.

### Phase 6: Coverage and maintainability

- Add product, cart, and checkout flows incrementally.
- Add tags for focused local runs and CI suites.
- Review duplicated code before introducing any helper.
- Validate scenario independence and prepare for controlled parallel execution.

## 15. Limitations and Future Scalability

This simplified design is intentionally transparent, but it has boundaries:

- The World can become crowded as coverage grows. Split related Page Object references into clearly named groups only when navigation becomes difficult to follow.
- A single API client can become large. Separate endpoint modules only when the client is demonstrably difficult to maintain; keep them as API clients, not a hidden services layer.
- Creating all common objects in Before can add setup cost. Optimize only after measuring runtime and only if object creation is no longer understandable.
- One QA environment limits testing across deployments and makes environment-specific defects harder to compare.
- Server-side data collisions remain possible even with isolated browser contexts.
- Cucumber parallelism can expose shared-account and reporting-order problems.
- Cucumber HTML and Allure duplicate some reporting information and increase artifact maintenance.
- Without schemas, API response shape checks rely on focused assertions and JSDoc rather than formal contract validation.
- Without a fixtures layer, setup is explicit but may become repetitive for advanced suites.

Future growth should be driven by a measured maintenance problem. Possible later additions are environment selection, dedicated test-data management, API modules, contract validation, or a fixture-like composition mechanism. None is required for the beginner framework.

## 16. Approval Gate

Implementation should begin only after this architecture is approved. The first implementation slice should be the project foundation, Custom World, hooks, one UI Page Object, one feature, and one focused Cucumber run. No additional architectural layer should be added during that slice without a concrete requirement.
