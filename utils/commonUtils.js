import process from 'node:process';

/**
 * Read a required environment variable without exposing its value in errors.
 *
 * @param {string} name Environment variable name.
 * @param {string} purpose Test purpose that requires the variable.
 * @returns {string}
 */
export function getRequiredEnv(name, purpose) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} in your local .env file before ${purpose}.`);
  }

  return value;
}

/**
 * Return the account created for this scenario or fail with a clear step error.
 *
 * @param {import('../features/support/world.js').CustomWorld} world Current scenario World.
 * @returns {Record<string, string>}
 */
export function requireApiAccount(world) {
  if (!world.apiTestAccount) {
    throw new Error('Prepare or create the API account before using its data in this scenario.');
  }

  return world.apiTestAccount;
}
