import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("AppModule configuration", () => {
  it("backendディレクトリから起動してもルートの.envを読み込む", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "cash-flow-config-"));
    const backendDir = join(tempRoot, "backend");
    const previousCwd = process.cwd();
    const previousProbe = process.env.CASHFLOW_CONFIG_PROBE;

    try {
      await mkdir(backendDir);
      await writeFile(join(tempRoot, ".env"), "CASHFLOW_CONFIG_PROBE=from-root\n");
      delete process.env.CASHFLOW_CONFIG_PROBE;
      process.chdir(backendDir);
      vi.resetModules();
      await import("./app.module");
      expect(process.env.CASHFLOW_CONFIG_PROBE).toBe("from-root");
    } finally {
      process.chdir(previousCwd);
      if (previousProbe === undefined) delete process.env.CASHFLOW_CONFIG_PROBE;
      else process.env.CASHFLOW_CONFIG_PROBE = previousProbe;
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
