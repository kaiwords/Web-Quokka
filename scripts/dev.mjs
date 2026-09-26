// Starts both apps in one terminal: the Next management app (staff CRM +
// client portal) on :3000 and the Vite marketing site on :5173.
//
// A hand-rolled spawner rather than `concurrently` so the repo root needs no
// node_modules of its own, and `shell: true` so it works with npm.cmd on
// Windows as well as npm on macOS/Linux.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const apps = [
  { name: "management", dir: "apps/management", color: "\x1b[36m" },
  { name: "web       ", dir: "apps/web", color: "\x1b[35m" },
];

const children = [];
let shuttingDown = false;

for (const app of apps) {
  const child = spawn("npm", ["run", "dev"], {
    cwd: join(root, app.dir),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = `${app.color}[${app.name}]\x1b[0m `;
  const relay = (stream, out) => {
    stream.setEncoding("utf8");
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      // Keep the trailing partial line for the next chunk, so a prefix is
      // never printed mid-line.
      buffer = lines.pop() ?? "";
      for (const line of lines) out.write(prefix + line + "\n");
    });
    stream.on("end", () => {
      if (buffer) out.write(prefix + buffer + "\n");
    });
  };
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);

  // One app dying should take the other down, rather than leaving a half-up
  // stack that looks like it's working.
  child.on("exit", (code) => {
    if (shuttingDown) return;
    console.log(`\n[dev] ${app.name.trim()} exited (${code}) — stopping the other app.`);
    shutdown(code ?? 1);
  });

  children.push(child);
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => shutdown(0));
