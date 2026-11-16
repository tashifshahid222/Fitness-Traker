const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const emptyToUndefined = (value) => (value === '' || value === undefined ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  MONGO_URI: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  ACCESS_TOKEN_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  REFRESH_TOKEN_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  CLIENT_URL: z.preprocess(emptyToUndefined, z.string().url()).default('http://localhost:5173'),
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum(['error', 'warn', 'info', 'http', 'debug']).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (!env.ACCESS_TOKEN_SECRET || !env.REFRESH_TOKEN_SECRET) {
    console.error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required in production');
    process.exit(1);
  }
  if (env.ACCESS_TOKEN_SECRET === env.REFRESH_TOKEN_SECRET) {
    console.error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different');
    process.exit(1);
  }
  if (!env.MONGO_URI) {
    console.error('MONGO_URI is required in production');
    process.exit(1);
  }
} else {
  if (!env.ACCESS_TOKEN_SECRET || !env.REFRESH_TOKEN_SECRET) {
    console.warn('WARNING: using development-only JWT secrets; set ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET outside development');
  }
  env.ACCESS_TOKEN_SECRET ||= 'fitness-tracker-dev-access-token-secret-do-not-use-in-production';
  env.REFRESH_TOKEN_SECRET ||= 'fitness-tracker-dev-refresh-token-secret-do-not-use-in-production';
  if (env.ACCESS_TOKEN_SECRET === env.REFRESH_TOKEN_SECRET) {
    console.error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different');
    process.exit(1);
  }
}

module.exports = { env: Object.freeze(env) };
