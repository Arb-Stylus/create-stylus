import { execa } from "execa";
import fs from "fs";
import path from "path";

const SKIP_DIRS = new Set([".git", "target", "node_modules", ".cargo"]);

function findContractDirs(dir: string): string[] {
  const result: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (fs.existsSync(path.join(fullPath, "Cargo.toml"))) {
      result.push(fullPath);
    } else {
      result.push(...findContractDirs(fullPath));
    }
  }

  return result;
}

export async function refreshCargoLocks(targetDir: string) {
  const stylusDir = path.join(targetDir, "packages", "stylus");

  if (!fs.existsSync(stylusDir)) return;

  const contractDirs = findContractDirs(stylusDir);

  if (contractDirs.length === 0) return;

  for (const contractDir of contractDirs) {
    try {
      try {
        await execa(
          "cargo",
          ["metadata", "--format-version", "1", "--offline"],
          { cwd: contractDir, stdio: "pipe" }
        );
      } catch {
        await execa("cargo", ["metadata", "--format-version", "1"], {
          cwd: contractDir,
          stdio: "pipe",
        });
      }
    } catch (error: any) {
      const isNotFound = error?.code === "ENOENT";
      const label = path.relative(targetDir, contractDir);
      if (isNotFound) {
        console.warn(
          `\n[warn] cargo not found on PATH — skipping Cargo.lock refresh for ${label}`
        );
      } else {
        console.warn(
          `\n[warn] Could not refresh Cargo.lock for ${label}: ${error?.message ?? error}`
        );
      }
    }
  }
}
