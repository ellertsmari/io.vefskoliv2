// Starts everything the browser tests need, in order: a throwaway MongoDB,
// the seed data, a production build, and the server. Playwright runs this as
// its web server (see playwright.config.ts) and stops it afterwards.
//
// A production build, not `next dev`: the Content-Security-Policy differs
// between the two, and the CSP test has to see what production sends.
//
//   E2E_SKIP_BUILD=1 reuses the build in .next-e2e (faster while writing tests).
const { spawn, spawnSync } = require("node:child_process");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { seed } = require("./seed.cjs");

const PORT = 3998;
const MONGO_PORT = 27998;
const NEXT = require.resolve("next/dist/bin/next");

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: MONGO_PORT, dbName: "e2e" },
  });
  const uri = `mongodb://127.0.0.1:${MONGO_PORT}/e2e`;
  await seed(uri);

  // Process env beats .env.local in Next, so none of this can reach the
  // database or the blob store that a developer's .env.local points at.
  const env = {
    ...process.env,
    MONGODB_CONNECTION: uri,
    AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else",
    NEXTAUTH_SECRET: "e2e-only-secret-not-used-anywhere-else",
    NEXTAUTH_URL: `http://localhost:${PORT}`,
    AUTH_TRUST_HOST: "true",
    BLOB_READ_WRITE_TOKEN: "",
    NEXT_DIST_DIR: ".next-e2e",
  };

  if (!process.env.E2E_SKIP_BUILD) {
    const build = spawnSync(process.execPath, [NEXT, "build"], {
      env,
      stdio: "inherit",
    });
    if (build.status !== 0) {
      await mongod.stop();
      process.exit(build.status ?? 1);
    }
  }

  const server = spawn(process.execPath, [NEXT, "start", "-p", String(PORT)], {
    env,
    stdio: "inherit",
  });

  const shutdown = async () => {
    server.kill();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  server.on("exit", shutdown);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
