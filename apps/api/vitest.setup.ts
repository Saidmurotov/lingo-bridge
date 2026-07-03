// Test env — lib/env.ts exits the process when required vars are missing.
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-secret-test-secret-test-secret';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.S3_ACCESS_KEY = 'test';
process.env.S3_SECRET_KEY = 'test';
process.env.WORKER_TOKEN = 'test-worker-token-test-worker-token';
