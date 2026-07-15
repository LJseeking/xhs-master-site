#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const envLocalPath = path.join(projectRoot, ".env.local");

const environments = {
  local: {
    name: "Local",
    appEnvironment: "local",
    apiBaseUrl: "http://localhost:13010"
  },
  test: {
    name: "Testing",
    appEnvironment: "test",
    apiBaseUrl: "http://xhsapitest.powermatrix.tech"
  },
  prod: {
    name: "Production",
    appEnvironment: "prod",
    apiBaseUrl: "https://xhsapi.powermatrix.tech"
  }
};

const env = process.argv[2];

if (!env) {
  console.log("\nxhs-master-site Environment Switcher");
  console.log("====================================\n");
  console.log("Usage:");
  console.log("  node scripts/switch-env.js local  # Switch to local backend");
  console.log("  node scripts/switch-env.js test   # Switch to testing backend");
  console.log("  node scripts/switch-env.js prod   # Switch to production backend");
  console.log("");
  process.exit(1);
}

if (!environments[env]) {
  console.error(`\nERROR: Unknown environment "${env}"`);
  console.error("Supported: local, test, prod\n");
  process.exit(1);
}

try {
  const config = environments[env];
  const content = [
    `NEXT_PUBLIC_APP_ENVIRONMENT=${config.appEnvironment}`,
    `NEXT_PUBLIC_API_BASE_URL=${config.apiBaseUrl}`,
    ""
  ].join("\n");

  fs.writeFileSync(envLocalPath, content, "utf8");

  console.log("\n✓ Environment switched successfully\n");
  console.log(`Environment: ${config.name}`);
  console.log(`API:         ${config.apiBaseUrl}`);
  console.log(`Env file:    ${envLocalPath}`);
  console.log("\nNext steps:");
  console.log("  1. npm run dev:local / dev:test / dev:prod");
  console.log("  2. npm run build:local / build:test / build:prod\n");
} catch (error) {
  console.error("\nERROR: Failed to write .env.local");
  console.error(`${error.message}\n`);
  process.exit(1);
}
