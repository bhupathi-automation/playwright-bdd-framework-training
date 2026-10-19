import { randomUUID } from 'node:crypto';
import apiData from '../features/test-data/api-data.json' with { type: 'json' };

/**
 * Create scenario-owned API account data with a unique email address.
 *
 * @param {string} password Password supplied by the local environment.
 * @returns {Record<string, string>}
 */
export function createUniqueApiAccount(password) {
  //We have password as input parameter
  /* To create a unique user account, we need following
  1. Account details like name, dateOfBirth, company etc.,
  2. Unique email Id
  3. Password */

  return {
    ...apiData.account,
    email: `${apiData.accountEmailPrefix}-${randomUUID()}@example.com`,
    //email: api-test-fadfkj34-krtr45-565656-dff@example.com
    password,
  };
}
