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
  await resignDarwinBinaries(target, destination);
  await verifyRuntime(target, destination);
}

// Apple revoked the Developer ID certificate the upstream @openai/codex macOS
// binaries are signed with, so Gatekeeper/AMFI kills them on launch with SIGKILL
// and surfaces a "codex" was not opened because it contains malware" dialog.
// Ad-hoc re-signing (`codesign --sign -`) replaces the revoked signature with a
// local ad-hoc one, which arm64 macOS requires and allows to run. This must run
// before the binary is ever executed — macOS moves a flagged binary to the trash
// the first time it's launched, so verifyRuntime deliberately never runs it.
async function resignDarwinBinaries(target, destination) {
  if (!target.includes("apple-darwin")) return;
  if (process.platform !== "darwin") {
    // codesign only exists on macOS; a cross-build can't fix the signature here.
    console.warn(`Skipping ad-hoc re-sign for ${target}: not on macOS. The bundled macOS Codex binary will be blocked by Gatekeeper until re-signed on a Mac.`);
    return;
  }
  const machOFiles = await collectMachOFiles(destination);
  for (const file of machOFiles) {
    await execFile("codesign", ["--force", "--sign", "-", file]);
  }
}

async function collectMachOFiles(root) {
  const found = [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectMachOFiles(full)));
    } else if (entry.isFile() && (await isMachO(full))) {
      found.push(full);
    }
  }
  return found;
}

// Detect Mach-O by leading magic (thin LE/BE or fat) so we only hand real
// executables/dylibs to codesign, not the plain files that sit alongside them.
async function isMachO(file) {
  const handle = await fs.open(file, "r");
  try {
    const buffer = Buffer.alloc(4);
    const { bytesRead } = await handle.read(buffer, 0, 4, 0);
    if (bytesRead < 4) return false;
    const magics = new Set([0xfeedface, 0xfeedfacf, 0xcafebabe, 0xcffaedfe, 0xcefaedfe, 0xbebafeca]);
    return magics.has(buffer.readUInt32BE(0)) || magics.has(buffer.readUInt32LE(0));
  } finally {
    await handle.close();
  }
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
