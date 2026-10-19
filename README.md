# Playwright BDD Framework Training

Beginner-friendly JavaScript automation for the [AutomationExercise](https://automationexercise.com/)
ecommerce application.

## UI automation suite

The project automates the [AutomationExercise](https://automationexercise.com/) UI with Cucumber.js
and Playwright. Current UI coverage includes login form validation and invalid credentials, home-page
navigation, product catalog metadata and search (matching and no-match), product details and quantity,
add-to-cart behavior, review-form validation and submission, and cart empty/add/quantity/remove behavior.

Static UI test values are kept in [features/test-data/ui-data.json](features/test-data/ui-data.json);
static API values are in [features/test-data/api-data.json](features/test-data/api-data.json).
Step definitions consume those fixtures rather than defining reusable test values inline.
The login and API verification scenarios use `VALID_EMAIL` and `VALID_PASSWORD` from a local
`.env` file. Use an account you control; never commit real credentials.

## Execution flow

UI scenarios follow this explicit path:

```text
Feature file -> Step definition -> Custom World -> Page Object -> Playwright -> AutomationExercise
```

Cucumber creates a scenario-scoped Custom World. The `Before` hook launches the browser for UI
scenarios and creates an API request context for `@api` scenarios. It assigns the matching objects to
World. Step definitions call those objects through `this`; Page Objects own UI locators and
interactions. The `After` hook captures configured UI failure evidence and closes scenario
resources. The suite uses no fixtures or additional service layer.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Internet access for the AutomationExercise QA environment

Node.js 24.18.1 and npm 11.16.0 were used to validate this foundation.

## Setup

```bash
npm install
npx playwright install chromium firefox webkit
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

The `.env` file is for local values only and is ignored by Git. Do not place credentials in source
control. The configuration module loads `.env` when present, while GitHub Actions can provide the
same variables through its environment. There is only one environment: `qa`.

Check the resolved configuration before running tests:

```bash
npm run config:check
```

The module validates URLs, browser name, booleans, and integer settings while it is imported.
Invalid startup configuration fails immediately with a readable error.

### Logging

The shared [`logger.js`](utils/logger.js) utility uses Winston directly; it adds no service or
framework layer. It writes timestamped `DEBUG`, `INFO`, `WARN`, and `ERROR` messages to the console.
`LOG_LEVEL` selects the minimum level and defaults to `INFO`; set it to `DEBUG` when you need
additional diagnostic detail. Invalid levels fail at startup.

Add these values to your local `.env` file or set them in the shell before a run:

```dotenv
LOG_LEVEL=DEBUG
LOG_TO_FILE=true
```

`LOG_TO_FILE=true` enables an additional log file under `artifacts/logs/`. File output is off by
default locally. Each file is named with the Cucumber worker ID and process ID, so parallel workers
do not overwrite one another. The directory is ignored by Git. GitHub Actions enables file logging
and includes the logs in its uploaded test artifacts; download the browser-specific
`reports-*` artifact from the workflow run to inspect logs alongside reports and screenshots.

The hooks log run and scenario lifecycle, tags, browser selection, failures, and retry status. Page
Objects log meaningful navigation and user actions; API calls log method, endpoint path, HTTP
status, and elapsed time. Failed scenarios attach a bounded excerpt from the same scenario's logs
to the Cucumber report. At `INFO`, routine locator operations are not logged; use `DEBUG` for
additional request-start details.

Log only safe context. Do not log credentials, tokens, headers, cookies, `.env` values, or complete
request/response bodies. This is good:

```js
logger.info(`API POST /api/verifyLogin status=${status} duration_ms=${duration}`);
logger.info('Submitting login form');
```

This is unsafe and should not be added:

```js
logger.info(`Logging in as ${email} with password ${password}`);
logger.debug(JSON.stringify({ headers, requestBody, responseBody }));
```

### Reports and failure debugging

Every run configured through [cucumber.js](cucumber.js) generates:

- Cucumber HTML at `artifacts/reports/cucumber/cucumber.html`
- Allure result files at `artifacts/reports/allure-results/`

Run the suite locally with `npm test` (or `npm run test:no-retries`). Open the Cucumber HTML file
in a browser for the scenario summary, steps, errors, and attachments. The Allure formatter and
Allure Report CLI are included in the development dependencies. Render the Allure results with:

```bash
npm run report:allure
npm exec -- allure open artifacts/reports/allure-report
```

The Allure formatter emits result data during the test run; the CLI command creates the browsable
report afterward. Each npm test command clears the previous Allure results first so the report
contains only the current run, including retries from that run. `npm run report:allure` replaces the
previous rendered report so its summary also matches the current results. `npm run report:cucumber`
runs Cucumber with the same configured report outputs.

The existing `After` hook saves a failure screenshot under `artifacts/screenshots/` and attaches it
to the Cucumber and Allure results. Email and password input fields are masked in screenshots.
Set `TRACE_ON_FAILURE=true` in `.env` to save a Playwright trace under `artifacts/traces/` on failed
UI scenarios; open one with:

```bash
npx playwright show-trace artifacts/traces/<scenario-id>.zip
```

Video is opt-in: set `VIDEO_ON_FAILURE=true` to record UI scenarios and retain videos only for
failed scenarios under `artifacts/videos/`. Successful scenario recordings are deleted. Recording
uses additional disk and CPU, so leave it disabled unless diagnosing an issue. Screenshot capture
defaults on (`SCREENSHOT_ON_FAILURE=true`); traces and video default off. GitHub Actions enables
screenshots and traces, leaves video off, renders Allure HTML, and uploads available reports, logs,
and failure evidence even when tests fail.

For a first failure investigation:

1. Start with the Cucumber HTML report and locate the failed scenario and first failing step.
2. Check the attached screenshot and the bounded scenario-log excerpt. Logs include scenario
   lifecycle, browser selection, retry state, and safe API timing/status details.
3. If enabled, inspect the trace in Playwright Trace Viewer to follow actions, DOM snapshots, and
   network timing; use the video only to confirm what appeared on screen.
4. Fix the underlying selector, wait, data, or environment issue before considering a retry. Review
   every failed attempt even if a later retry passes.

Never log credentials, tokens, cookies, authorization headers, or complete request/response bodies.
Use dedicated QA accounts rather than production identities. Traces and videos can contain page
content and network details even when screenshots mask credential inputs; treat all generated
artifacts as sensitive and share them only with authorized reviewers.

### API testing

`API_BASE_URL` configures the API root and defaults to
`https://automationexercise.com/api`. Copy `.env.example` to `.env`, then set `VALID_EMAIL` and
`VALID_PASSWORD` to valid credentials for an account you control. Those values are used only by the
login verification scenario and as the password for unique, scenario-created test accounts.

Playwright browser binaries can also be installed separately:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

On Linux CI, install the browser's system dependencies with
`npx playwright install --with-deps chromium firefox webkit`.

### API testing

The reusable [ApiClient](src/api/api-client.js) wraps Playwright's `APIRequestContext`. The `Before`
hook creates it only for scenarios tagged `@api`, stores it on the Custom World, and the `After`
hook removes any test account that a scenario did not explicitly delete. API steps use
`this.apiClient`; routes and test values are stored in
[api-endpoints.json](features/test-data/api-endpoints.json) and
[api-data.json](features/test-data/api-data.json).

```js
this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
  form: { search_product: 'top' },
});
this.apiClient.validateStatus(this.apiResponse, 200);
const responseBody = await this.apiResponse.json();
```

The client provides `get`, `post`, `put`, and `delete`, plus Playwright assertions for HTTP status,
API response code, messages, product results, and user details. The API feature covers documented
product search, login verification, and account create, update, delete, and lookup endpoints from
the [AutomationExercise API list](https://www.automationexercise.com/api_list). Account scenarios
use unique generated email addresses and clean up created accounts.

### UI and API integration testing

The `@integration` scenario in [features/integration.feature](features/integration.feature) creates
a unique account through the API, retains its credentials on the current World, logs in through the
existing LoginPage, verifies the logged-in username through the HomePage, then deletes the account
and verifies through the API that it can no longer be retrieved. The `Before` hook creates both API
and browser resources for this tag; the `After` hook remains a cleanup safeguard if a scenario fails
before reaching the explicit delete step. Nothing scenario-specific is stored globally.

The shared [testData.js](utils/testData.js) factory clones the static account fields and creates a
unique email for each API scenario. The generated account is assigned to `this.apiTestAccount` on
that scenario's Custom World, so steps can reuse the same data without sharing mutable account state.
Use this factory when a scenario needs unique account data; keep stable values in the JSON test-data
files and avoid adding a factory for one-off literal values.

The [commonUtils.js](utils/commonUtils.js) helpers are limited to repeated cross-step needs:
`getRequiredEnv` reads required local configuration without exposing its value in errors, and
`requireApiAccount` validates scenario-owned account data before it is used by API or integration
steps. Use the existing [logger.js](utils/logger.js) for structured diagnostics; do not log
credentials or create a separate logging wrapper.

Run the scenario with `npm run test:integration`. The configured Cucumber HTML and Allure results
are generated for this filtered run as well.

### Configuration overrides

Defaults are suitable for local execution. Set `HEADLESS=true` in CI or use the optional variables
in `.env.example` to override browser, timeout, screenshot, trace, or video behavior. Cucumber retries
default to zero in every environment; choose a retry count explicitly with the npm commands below.

The Custom World imports the shared configuration instead of reading process variables directly:

```js
import { config } from '../../config/config.js';

export class CustomWorld {
  constructor() {
    this.config = config;
  }
}
```

The Before hook uses the same object when creating Playwright resources:

```js
import { chromium } from 'playwright';
import { config } from '../../config/config.js';

const browser = await chromium.launch({
  headless: config.browser.headless,
  slowMo: config.browser.slowMo,
});
```

The hooks also apply `config.timeout`, `config.retry`, `config.screenshot`, `config.trace`, and
`config.video`.

### Cucumber scenario retries

The installed `@cucumber/cucumber` version is 13.2.1. Cucumber.js supports scenario-level retries
with the `retry` configuration option (also available as `--retry <count>`). It reruns a failed
scenario from its first step; it does not retry individual Playwright actions or assertions. The
framework wires this option through `cucumber.js` to `config.retry.cucumber`.

Run normally with no retries, or opt in to two retries:

```bash
npm run test:no-retries
npm run test:retry
```

Two retries means **up to three total attempts**: one initial execution and at most two retries.
Passing scenarios run only once. An exhausted scenario still fails the run.

Each attempt is a new Cucumber scenario execution and runs the existing `Before`/`After` hooks.
This creates a new Custom World, browser/context/page and Page Objects for UI scenarios, a new
`APIRequestContext` and `ApiClient` for API scenarios, and both sets of resources for integration
scenarios. The `After` hook captures failed-attempt evidence, removes scenario-created accounts,
stops tracing, and disposes the request context and browser resources before Cucumber starts again.
Every screenshot, trace, and retained video filename includes a unique attempt ID, so a retry does
not overwrite evidence from the earlier failure. Cucumber's `willBeRetried` hook value is attached with the
failure details, distinguishing an intermediate failure from the final result.

To demonstrate retries without relying on the QA application being flaky, run:

```bash
npm run test:retry-demo
```

This opt-in command intentionally fails the first attempt of three small scenarios and passes on
their retry. The scenarios check that UI, API, and integration attempts receive different resource
objects. The intentional failure is gated by `RETRY_DEMO=true`, so they pass as ordinary scenarios
in normal suite runs. The demo uses an in-process counter only to simulate a transient condition;
real scenario state belongs on the Custom World.

Use retries as a diagnostic buffer for transient infrastructure/network noise, not to make known
application defects pass. Do not retry unstable assertions or replace proper waits, stable
selectors, deterministic test data, or scenario isolation with retries. Review intermediate
failure messages and attachments even when the final attempt passes; a recovered retry is evidence
of a flaky test or environment and should be investigated. A failure after all configured attempts
remains a failure.

Cucumber formatters process each attempt while reporting the scenario's final status. The hook logs
whether a failure will be retried and attaches that attempt's original error. Allure receives
attempt-specific results and attachments under the same stable scenario identity; retain them when
reviewing retries rather than treating an intermediate failure as a clean pass.

### Cross-browser execution

`BROWSER` selects the browser engine and accepts only `chromium`, `firefox`, or `webkit`. It
defaults to `chromium`; unsupported values fail during configuration loading. The `test:chromium`,
`test:firefox`, and `test:webkit` npm scripts select a browser without changing the feature files,
Page Objects, QA URL, or timeout settings:

```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

To run the same `@home` scenarios in all three browsers, use:

```bash
npm run test:chromium -- --tags "@home"
npm run test:firefox -- --tags "@home"
npm run test:webkit -- --tags "@home"
```

Each run writes the configured reports to the same paths and starts with fresh Allure results, so
save a copy before the next run if you need local browser-by-browser comparisons. UI scenario reports
include a `Browser: <name>` attachment. API-only scenarios do not launch a browser. Browser selection
also applies to parallel Cucumber runs; for example, on Windows use
`npx cross-env BROWSER=firefox npm run test:parallel`. Each scenario still launches and closes its
own browser, context, page, and Page Objects in the existing hooks, so parallel workers do not share
browser state.

The [GitHub Actions workflow](.github/workflows/cross-browser.yml) runs all three browsers on pushes
and pull requests. Use **Actions → Cross-browser Cucumber → Run workflow** to select one browser or
`all`; each matrix run uploads its browser-specific Cucumber report and Allure results.

Chromium uses Blink, Firefox uses Gecko, and WebKit uses Apple's WebKit engine (Playwright WebKit is
not the same binary as installed Safari). Differences in font rendering, layout, input behavior, and
engine support can expose browser-specific issues; prefer semantic locators and web-first assertions
over pixel-perfect assumptions or fixed sleeps. Common setup failures are missing browser binaries
(`npx playwright install <browser>`) and missing Linux system libraries (use `--with-deps` in CI).
The shared QA site or network can also behave inconsistently, so distinguish application/network
failures from a browser-engine regression before changing Page Objects.

### Parallel execution

This project uses **Cucumber.js** as its test runner. Cucumber's `--parallel <workers>` option
distributes scenarios across worker processes. Each scenario still receives its own Custom World
and runs the existing `Before` and `After` hooks. This is different from Playwright Test workers:
those belong to Playwright Test's runner and fixture lifecycle. Adding Playwright Test would add a
second runner and change this framework's architecture, so it is not used here.

`npm test` runs scenarios serially by default. `npm run test:parallel` runs them with three Cucumber
workers. The worker count is the `--parallel` number in the `test:parallel` script in
[package.json](package.json); change `3` there to a smaller or larger number. You can also choose a
count for one run without editing the script:

```bash
npx cucumber-js --config cucumber.js --parallel 2
```

The project-level [Cucumber configuration](cucumber.js) sets parallel execution to `0` (serial)
unless the command explicitly supplies a worker count. Run the two read-only demonstration API
scenarios together with:

```bash
npx cucumber-js --config cucumber.js --tags "@parallel" --parallel 2
```

The scenarios are marked `@parallel` in the API feature: one reads the product list and one searches
for a product. Each uses its own API request context and response state, so neither depends on the
other. Cucumber merges worker messages for its formatters; failure screenshots and traces also
include a unique scenario ID in their filenames.

Every UI scenario launches its own browser, context, page, and Page Objects in `Before`; `After`
captures evidence, cleans up scenario-created API accounts, then closes its API context, browser
context, and browser. API-only scenarios get their own API request context and do not launch an
unneeded browser. There are no `BeforeAll` or `AfterAll` hooks or module-level mutable test data.

The worker count controls load on both the test machine and the single shared QA environment.
Reduce it to `1` (serial) or `2` if the QA site/API rate-limits requests, server-side test data
conflicts, browser processes exhaust local resources, or runs become flaky. Higher worker counts
are not automatically faster.

Common mistakes when enabling parallel execution:

- Do not use a shared account, cart, or other mutable server-side data in multiple scenarios.
  Create unique records and clean them up in the same scenario.
- Do not put scenario state in module-level variables. Keep API responses, account details, and
  other mutable values on the current World.
- Do not reuse artifact names based only on scenario titles; concurrent scenarios can have the same
  title. The hooks add a unique ID to screenshot and trace names.
- Do not assume scenarios execute in feature-file order or coordinate them with fixed sleeps.
  Make each scenario independent and use Playwright's auto-waiting assertions.
- For debugging, first run only `@parallel` with two workers; then reduce to one worker to separate
  concurrency problems from an individual scenario failure. Use `npm run test:debug` for Playwright
  browser/API logs.

## npm scripts

| Script                         | Purpose                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `npm test`                     | Run all Cucumber scenarios serially.                                               |
| `npm run test:no-retries`      | Run all scenarios with Cucumber retries explicitly disabled.                       |
| `npm run test:retry`           | Run all scenarios with two retries (up to three attempts per failing scenario).    |
| `npm run test:retry-demo`      | Demonstrate one failed attempt then a pass for UI, API, and integration resources. |
| `npm run test:parallel`        | Run all Cucumber scenarios with three workers.                                     |
| `npm run test:chromium`        | Run all Cucumber scenarios in Chromium.                                            |
| `npm run test:firefox`         | Run all Cucumber scenarios in Firefox.                                             |
| `npm run test:webkit`          | Run all Cucumber scenarios in WebKit.                                              |
| `npm run test:ui`              | Run scenarios tagged `@ui`.                                                        |
| `npm run test:api`             | Run scenarios tagged `@api`.                                                       |
| `npm run test:integration`     | Run scenarios tagged `@integration`.                                               |
| `npm run test:headed`          | Run with `HEADLESS=false` for visible browser execution.                           |
| `npm run test:debug`           | Enable Playwright browser and API debug logs and stop after the first failure.     |
| `npm run report:cucumber`      | Run scenarios and generate the configured Cucumber and Allure result files.        |
| `npm run report:allure`        | Render `artifacts/reports/allure-results/` with the bundled Allure CLI.            |
| `npm run clean:allure-results` | Remove prior Allure result files before a run.                                     |
| `npm run config:check`         | Load and validate the resolved QA configuration.                                   |
| `npm run lint`                 | Check JavaScript with ESLint.                                                      |
| `npm run format:check`         | Verify formatting for project configuration, source, features, and documentation.  |
| `npm run format`               | Format project configuration, source, features, and documentation.                 |

Use `HEADLESS=true` for local headless execution, or `npm run test:headed` to see the browser. UI
areas can be run by tag, for example `npx cucumber-js --tags "@cart"`.

## Coding conventions

- Use ES module `import` and `export` syntax.
- Use `const` by default and `let` only when reassignment is required.
- Use `async` and `await` for Playwright and Cucumber operations.
- Add JSDoc to constructors, public methods, World properties, API response shapes, and non-obvious
  data objects. Use `@param`, `@returns`, and `@throws` where they clarify a contract.
- Use `@typedef` for reusable object shapes and `@property` for their fields.
- Keep JSDoc descriptions concise and describe business intent rather than implementation details.
- Keep selectors, browser actions, and UI assertions inside Page Objects when those are introduced.
- Initialize each Page Object's static Playwright locators once in its constructor; use scenario data
  only for dynamic locator values such as a product name.
- Keep page-specific browser interactions in Page Objects and HTTP requests in the API client.
- Use Playwright's web-first `expect` assertions for UI state and let locator actions auto-wait.
- Keep scenario state on the Custom World; the opt-in retry demonstration is the exception, as its
  process-local counter intentionally simulates a transient failure across fresh Worlds.
- Keep step definitions focused on translating Gherkin into framework calls.

## Project structure

The approved architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The
current implementation includes:

- `features/support/world.js`: scenario-scoped Custom World
- `features/support/hooks.js`: browser, context, Page Object, API client, evidence, and cleanup lifecycle
- `features/step-definitions/`: Gherkin-to-World calls
- `src/pages/`: Home, Login, Registration, Products, Product Details, and Cart Page Objects that
  receive the scenario Page
- `src/api/api-client.js`: thin `APIRequestContext` wrapper
- `cucumber.js`: Cucumber.js runner configuration

Step definitions access framework objects through `this`, for example:

```js
Given('the user opens the AutomationExercise home page', async function () {
  await this.homePage.open();
});
```

The Before hook is the only composition point for Page Objects. Each object receives the scenario's
Playwright `Page`, keeps its selectors locally, and exposes intent-based UI methods. Page Objects do
not use fixtures, call APIs, or contain Cucumber step logic. Supply credentials and registration
details as scenario data; never store real credentials in Page Objects or source control.

No Page Object is shared between scenarios. Each UI scenario's Before hook creates fresh objects
over a fresh browser context, and its After hook closes that context and browser. Cucumber workers
do not change this per-scenario lifecycle. UI reports include the selected browser as a scenario
attachment.

## Reports and generated files

Reports, screenshots, traces, videos, logs, Allure results, and installed dependencies are ignored
by Git. See [Reports and failure debugging](#reports-and-failure-debugging) for artifact locations,
local commands, and a beginner-friendly failure investigation workflow.
