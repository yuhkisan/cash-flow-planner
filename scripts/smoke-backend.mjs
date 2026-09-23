import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function main() {
  if (!process.env.npm_execpath) {
    throw new Error("Run this smoke check through npm run smoke:backend");
  }

  const port = await availablePort();
  const backend = spawn(
    process.execPath,
    [process.env.npm_execpath, "run", "start", "--workspace=backend"],
    {
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      windowsHide: true,
    },
  );
  let output = "";
  let spawnError;
  backend.once("error", (error) => { spawnError = error; });
  for (const stream of [backend.stdout, backend.stderr]) {
    stream.on("data", (chunk) => { output += chunk.toString(); });
  }

  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnError || backend.exitCode !== null) {
        throw new Error(`Backend exited before becoming healthy.\n${spawnError ?? output}`);
      }
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        if (response.ok && (await response.json()).status === "ok") {
          console.log("Backend started and /health returned ok");
          return;
        }
      } catch {
        // The server may not be listening yet.
      }
      await delay(250);
    }
    throw new Error(`Backend did not become healthy within 15 seconds.\n${output}`);
  } finally {
    if (backend.pid && backend.exitCode === null) {
      if (process.platform === "win32") {
        const result = spawnSync("taskkill", ["/PID", String(backend.pid), "/T", "/F"], {
          encoding: "utf8",
          windowsHide: true,
          timeout: 5000,
        });
        if (result.status !== 0) {
          throw new Error(`Could not stop smoke-test backend: ${result.error ?? result.stderr}`);
        }
      } else {
        try { process.kill(-backend.pid, "SIGTERM"); } catch { /* Already exited. */ }
      }
    }
  }
}

await main();
