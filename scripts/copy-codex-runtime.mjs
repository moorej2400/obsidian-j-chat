import childProcess from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL("./codex-runtime-targets.json", import.meta.url), "utf8"));

const targets = [...new Set([...manifest.requiredTargets, targetTriple()])];
await fs.rm(path.resolve("codex-runtime"), { recursive: true, force: true });

for (const target of targets) {
  await copyRuntimeTarget(target);
}

console.log(`Copied bundled Codex runtimes for ${targets.join(", ")}.`);

async function copyRuntimeTarget(target) {
  const packageName = manifest.packages[target];
  const packageSpec = manifest.packageSpecs[target];
  if (!packageName || !packageSpec) {
    throw new Error(`No Codex runtime package mapping exists for ${target}.`);
  }

  const packageRoot = await resolvePackageRoot(packageName, packageSpec);
  const source = path.join(packageRoot, "vendor", target);
  const destination = path.resolve("codex-runtime", target);

  await fs.access(source);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
  await verifyRuntime(target, destination);
}

async function resolvePackageRoot(packageName, packageSpec) {
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    // npm filters optional native packages by host OS, so a Mac build may need
    // to pack the Windows Codex tarball explicitly for a portable plugin bundle.
    return await downloadPackage(packageSpec);
  }
}

async function downloadPackage(packageSpec) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-j-chat-codex-runtime-"));
  const packOutput = await execFile("npm", ["pack", packageSpec, "--pack-destination", tempDir, "--json"]);
  const [packed] = JSON.parse(packOutput);
  if (!packed?.filename) throw new Error(`npm pack did not return a filename for ${packageSpec}.`);

  const tarball = path.join(tempDir, packed.filename);
  await execFile("tar", ["-xzf", tarball, "-C", tempDir]);
  return path.join(tempDir, "package");
}

async function verifyRuntime(target, destination) {
  const binary = target.includes("windows") ? "codex.exe" : "codex";
  await fs.access(path.join(destination, "codex", binary));
}

function execFile(file, args) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(file, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${file} ${args.join(" ")} failed${stderr ? `: ${stderr.trim()}` : ""}`, { cause: error }));
      } else {
        resolve(stdout);
      }
    });
  });
}

function targetTriple() {
  if (process.platform === "darwin" && process.arch === "arm64") return "aarch64-apple-darwin";
  if (process.platform === "darwin" && process.arch === "x64") return "x86_64-apple-darwin";
  if ((process.platform === "linux" || process.platform === "android") && process.arch === "arm64") return "aarch64-unknown-linux-musl";
  if ((process.platform === "linux" || process.platform === "android") && process.arch === "x64") return "x86_64-unknown-linux-musl";
  if (process.platform === "win32" && process.arch === "arm64") return "aarch64-pc-windows-msvc";
  if (process.platform === "win32" && process.arch === "x64") return "x86_64-pc-windows-msvc";
  throw new Error(`Unsupported Codex runtime platform: ${process.platform}/${process.arch}`);
}
