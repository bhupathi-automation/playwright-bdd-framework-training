import { rm } from 'node:fs/promises';
import path from 'node:path';

await rm(path.resolve('artifacts', 'reports', 'allure-results'), {
  recursive: true,
  force: true,
});
