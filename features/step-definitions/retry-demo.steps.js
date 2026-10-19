import { Then } from '@cucumber/cucumber';
import process from 'node:process';

// This state is used only by the opt-in retry demonstration, never by real scenarios.
const failedDemoAttempts = new Map();

Then('the {string} retry demonstration checks fresh scenario resources', function (scenarioType) {
  const resourcesByType = {
    ui: [this.context, this.page, this.homePage],
    api: [this.apiRequestContext, this.apiClient],
    integration: [this.context, this.page, this.homePage, this.apiRequestContext, this.apiClient],
  };
  const resources = resourcesByType[scenarioType];

  if (!resources || resources.some((resource) => !resource)) {
    throw new Error(
      `The ${scenarioType} retry demonstration did not receive its expected resources.`,
    );
  }

  if (process.env.RETRY_DEMO !== 'true') {
    return;
  }

  const firstAttemptResources = failedDemoAttempts.get(scenarioType);
  if (!firstAttemptResources) {
    failedDemoAttempts.set(scenarioType, resources);
    throw new Error(
      `Intentional first-attempt failure for the ${scenarioType} retry demonstration.`,
    );
  }

  if (resources.some((resource, index) => resource === firstAttemptResources[index])) {
    throw new Error(`The ${scenarioType} retry reused resources from its failed attempt.`);
  }

  failedDemoAttempts.delete(scenarioType);
});
