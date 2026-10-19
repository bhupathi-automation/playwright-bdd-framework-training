import { expect } from 'playwright/test';
import { performance } from 'node:perf_hooks';
import { URL } from 'node:url';
import logger from '../../utils/logger.js';

/**
 * A small, reusable wrapper around Playwright's APIRequestContext.
 *
 * It sends requests and provides simple, reusable checks for the response
 * formats used by the AutomationExercise API.
 */
export class ApiClient {
  /**
   * @param {import('playwright').APIRequestContext} requestContext
   *   Playwright's scenario-scoped HTTP context.
   * @param {string} baseUrl
   *   The API root URL, for example https://automationexercise.com/api.
   */
  constructor(requestContext, baseUrl) {
    this.requestContext = requestContext;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Send a GET request to an endpoint under the configured API root.
   *
   * Request options are passed straight through to Playwright, so callers can
   * provide headers, query parameters, timeouts, and other supported options.
   *
   * @param {string} path Endpoint path, for example /productsList.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} [options]
   * @returns {Promise<import('playwright').APIResponse>}
   */
  async get(path, options = {}) {
    return this.send('GET', path, options);
  }

  /**
   * Send a POST request. Use `data` for a JSON body or `form` for form fields.
   *
   * @param {string} path Endpoint path.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} [options]
   * @returns {Promise<import('playwright').APIResponse>}
   */
  async post(path, options = {}) {
    return this.send('POST', path, options);
  }

  /**
   * Send a PUT request to an endpoint that supports PUT.
   *
   * @param {string} path Endpoint path.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} [options]
   * @returns {Promise<import('playwright').APIResponse>}
   */
  async put(path, options = {}) {
    return this.send('PUT', path, options);
  }

  /**
   * Send a DELETE request to an endpoint that supports DELETE.
   *
   * @param {string} path Endpoint path.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} [options]
   * @returns {Promise<import('playwright').APIResponse>}
   */
  async delete(path, options = {}) {
    return this.send('DELETE', path, options);
  }

  /**
   * Send a request and return Playwright's response unchanged. Returning the
   * APIResponse lets a step inspect status, headers, or parse the body as JSON.
   *
   * The request headers and supported payload types are separated from the
   * other request settings before the request is sent.
   *
   * Use only one payload option at a time:
   * - `data` for JSON, text, or binary data.
   * - `form` for URL-encoded form fields.
   * - `multipart` for multipart form fields, including file uploads.
   *
   * Request headers and body options are never printed or logged.
   * The safe error message deliberately excludes query strings and request
   * options because they can contain tokens, passwords, or other secret values.
   *
   * @param {'GET'|'POST'|'PUT'|'DELETE'} method HTTP method.
   * @param {string} path Endpoint path relative to the configured API root.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} options
   * @returns {Promise<import('playwright').APIResponse>}
   * @throws {Error} When the request cannot be sent.
   */
  async send(method, path, options = {}) {
    const requestMethod = method.toUpperCase();
    const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    if (!supportedMethods.includes(requestMethod)) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const endpoint = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    const safeEndpoint = new URL(endpoint).pathname;
    const startedAt = performance.now();
    logger.debug(`API request started: ${requestMethod} ${safeEndpoint}`);

    try {
      // Keep headers separate so it is clear which settings apply to the
      // request's headers and which settings control the request itself.
      const headers = options.headers ?? {};
      const { data, form, multipart, ...otherOptions } = options;

      // Start with common settings such as query parameters, timeouts, and
      // status-code handling. The payload options are added below only when
      // the caller has supplied them.
      const requestOptions = {
        ...otherOptions,
        headers,
      };

      // Playwright supports several body formats. Pass through whichever
      // format the caller supplied rather than converting it here.
      if (data !== undefined) {
        requestOptions.data = data;
      }

      if (form !== undefined) {
        requestOptions.form = form;
      }

      if (multipart !== undefined) {
        requestOptions.multipart = multipart;
      }

      // Use Playwright's dedicated method for each HTTP verb.
      let response;
      switch (requestMethod) {
        case 'GET':
          response = await this.requestContext.get(endpoint, requestOptions);
          break;
        case 'POST':
          response = await this.requestContext.post(endpoint, requestOptions);
          break;
        case 'PUT':
          response = await this.requestContext.put(endpoint, requestOptions);
          break;
        case 'DELETE':
          response = await this.requestContext.delete(endpoint, requestOptions);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      const duration = (performance.now() - startedAt).toFixed(1);
      logger.info(
        `API ${requestMethod} ${safeEndpoint} status=${response.status()} duration_ms=${duration}`,
      );
      return response;
    } catch (error) {
      const duration = (performance.now() - startedAt).toFixed(1);
      logger.error(`API ${requestMethod} ${safeEndpoint} failed duration_ms=${duration}`);
      throw new Error(
        `${method} request to "${path}" could not be completed. Check the API URL and network connection.`,
        { cause: error },
      );
    }
  }

  /**
   * Check the actual HTTP status returned by the server. AutomationExercise
   * also returns an application-level `responseCode` in its JSON body; use
   * `validateResponseCode` to check that separate value.
   *
   * @param {import('playwright').APIResponse} response
   * @param {number} expectedStatus
   * @returns {import('playwright').APIResponse} The same response for chaining.
   * @throws {Error} When the response status differs from the expected status.
   */
  validateStatus(response, expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
    return response;
  }

  /**
   * Check the application-level status code in an AutomationExercise JSON
   * response. This is distinct from the HTTP status checked by validateStatus.
   *
   * @param {Record<string, unknown>} responseBody Parsed JSON response.
   * @param {number} expectedCode Expected value of the `responseCode` field.
   * @returns {void}
   */
  validateResponseCode(responseBody, expectedCode) {
    expect(responseBody.responseCode).toBe(expectedCode);
  }

  /**
   * Check the API's human-readable message, such as "User created!".
   *
   * @param {Record<string, unknown>} responseBody Parsed JSON response.
   * @param {string} expectedMessage Expected value of the `message` field.
   * @returns {void}
   */
  validateMessage(responseBody, expectedMessage) {
    expect(responseBody.message).toBe(expectedMessage);
  }

  /**
   * Check that a successful product response contains a products array.
   *
   * @param {Record<string, unknown>} responseBody Parsed JSON response.
   * @param {string} [expectedProductName] Product that should appear in results.
   * @returns {void}
   */
  validateProducts(responseBody, expectedProductName) {
    expect(responseBody.products).toBeInstanceOf(Array);

    if (expectedProductName !== undefined) {
      expect(responseBody.products).toContainEqual(
        expect.objectContaining({ name: expectedProductName }),
      );
    } else {
      expect(responseBody.products).not.toHaveLength(0);
    }
  }

  /**
   * Check the empty result returned when a valid product search finds no match.
   *
   * @param {Record<string, unknown>} responseBody Parsed JSON response.
   * @returns {void}
   */
  validateNoProducts(responseBody) {
    expect(responseBody.products).toEqual([]);
  }

  /**
   * Check that user details include the supplied identifying or updated fields.
   *
   * @param {Record<string, unknown>} responseBody Parsed JSON response.
   * @param {Record<string, string>} expectedUserFields Fields to verify.
   * @returns {void}
   */
  validateUserDetails(responseBody, expectedUserFields) {
    expect(responseBody.user).toEqual(expect.objectContaining(expectedUserFields));
  }
}
