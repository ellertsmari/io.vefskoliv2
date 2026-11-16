// Starts everything the browser tests need, in order: a throwaway MongoDB,
// the seed data, a production build, and the server. Playwright runs this as
// its web server (see playwright.config.ts) and stops it afterwards.
//
// A production build, not `next dev`: the Content-Security-Policy differs
// between the two, and the CSP test has to see what production sends.
//
//   E2E_SKIP_BUILD=1 reuses the build in .next-e2e (faster while writing tests).
//
// `--dev` (yarn e2e:dev) is for checking a change by hand rather than running
// the tests: the same throwaway database with the fuller seed, but `next dev`,
// which is up in seconds and reloads as you edit. It has its own ports so it
// can run beside the tests. See .claude/skills/verify.
const { spawn, spawnSync } = require("node:child_process");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { seed, PASSWORD, USERS, VERIFY_USERS, IDS } = require("./seed.cjs");

const DEV = process.argv.includes("--dev");
const PORT = DEV ? 3999 : 3998;
const MONGO_PORT = DEV ? 27999 : 27998;
const NEXT = require.resolve("next/dist/bin/next");

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: MONGO_PORT, dbName: "e2e" },
  });
  const uri = `mongodb://127.0.0.1:${MONGO_PORT}/e2e`;
  await seed(uri, { verify: DEV });

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
  if (DEV) {
    // What `yarn dev` sets: without a file, Node's own localStorage breaks
    // code that checks for one while rendering on the server.
    env.NODE_OPTIONS = [process.env.NODE_OPTIONS, "--localstorage-file=/tmp/next-e2e-localstorage"]
      .filter(Boolean)
      .join(" ");
  }

  if (!DEV && !process.env.E2E_SKIP_BUILD) {
    const build = spawnSync(process.execPath, [NEXT, "build"], {
      env,
      stdio: "inherit",
    });
    if (build.status !== 0) {
      await mongod.stop();
      process.exit(build.status ?? 1);
    }
  }

  const server = spawn(process.execPath, [NEXT, DEV ? "dev" : "start", "-p", String(PORT)], {
    env,
    stdio: "inherit",
  });

  if (DEV) {
    const people = Object.values({ ...USERS, ...VERIFY_USERS })
      .map((user) => `  ${user.email.padEnd(18)} ${user.role}`)
      .join("\n");
    console.log(
      `\nThrowaway app on http://localhost:${PORT} (database: ${uri})\n` +
        `Password for everyone: ${PASSWORD}\n${people}\n` +
        `Guides: /guides/${IDS.returnGuide} (return), /guides/${IDS.quizGuide} (quiz), ` +
        `/guides/${IDS.exerciseGuide} (full exercise)\n`
    );
  }

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
