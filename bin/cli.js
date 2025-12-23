#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * 1. CONFIGURATION & TEMPLATES
 */
const HOOKS_DIR = ".boru";

const TEMPLATES = {
  "pre-commit": {
    desc: "Runs before creating a commit (tests, linting)",
    content: `#!/bin/sh
        # ------------------------------------------------------------------
        # PRE-COMMIT HOOK
        # This script runs before the commit is created.
        # If it exits with a non-zero status, the commit is aborted.
        # ------------------------------------------------------------------

        echo "→ ⚡ Running pre-commit checks..."

        # Example: Run linter
        # npm run lint

        # Example: Run tests
        # npm test
        `,
  },
  "pre-push": {
    desc: "Runs before pushing (e.g., protect main branch)",
    content: `#!/bin/sh
        # ------------------------------------------------------------------
        # PRE-PUSH HOOK
        # This script runs before changes are pushed to the remote.
        # ------------------------------------------------------------------

        echo "→ 🚀 Running pre-push checks..."

        # Example: Prevent pushing directly to main
        # Note: The double backslash below is required for JS string escaping.
        current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

        if [ "$current_branch" = "main" ]; then
            echo "⚠️  Direct push to 'main' is restricted."
            # Uncomment the next line to enforce the block:
            # exit 1
        fi
        `,
  },
  "commit-msg": {
    desc: "Validates the commit message (Conventional Commits)",
    content: `#!/bin/sh
        # ------------------------------------------------------------------
        # COMMIT-MSG HOOK
        # This script validates the commit message.
        # The message file path is passed as the first argument ($1).
        # ------------------------------------------------------------------

        echo "→ 📝 Checking commit message format..."

        # Example: Use commitlint
        # npx commitlint --edit "$1"
        `,
  },
};
/**
 * 2. UI COMPONENTS (Zero dependencies)
 */

// Menú de selección múltiple (código previo)
async function multiselect(options) {
  const { stdin, stdout } = process;
  let cursor = 0;
  const selected = new Set([0]);

  stdout.write("\x1b[?25l");

  const render = () => {
    stdout.moveCursor(0, -options.length);
    options.forEach((opt, i) => {
      const isSelected = selected.has(i);
      const isCursor = i === cursor;
      const checkbox = isSelected ? "\x1b[32m◉\x1b[0m" : "\x1b[2m◯\x1b[0m";
      const pointer = isCursor ? "\x1b[36m❯\x1b[0m" : " ";
      const label = isCursor ? `\x1b[1m${opt.name}\x1b[0m` : opt.name;
      const desc = `\x1b[2m- ${opt.desc}\x1b[0m`;
      stdout.clearLine(0);
      stdout.write(`${pointer} ${checkbox} ${label} ${desc}\n`);
    });
  };

  stdout.write("\n".repeat(options.length));
  render();

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve) => {
    const handleKey = (key) => {
      if (key === "\u0003") {
        stdout.write("\x1b[?25h");
        process.exit(1);
      }
      if (key === "\u001b[A") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        render();
      }
      if (key === "\u001b[B") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        render();
      }
      if (key === " ") {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        render();
      }
      if (key === "\r") {
        stdin.removeListener("data", handleKey);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\x1b[?25h");
        resolve(Array.from(selected).map((i) => options[i].key));
      }
    };
    stdin.on("data", handleKey);
  });
}

async function confirm(question) {
  const { stdin, stdout } = process;

  stdout.write(`${question} \x1b[2m(Y/n)\x1b[0m `);

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve) => {
    const handleKey = (key) => {
      if (key === "\u0003") {
        process.exit(1);
      }

      if (key === "\r" || key.toLowerCase() === "y") {
        stdout.write("\x1b[32mYes\x1b[0m\n");
        cleanup(true);
      } else if (key.toLowerCase() === "n") {
        stdout.write("\x1b[31mNo\x1b[0m\n");
        cleanup(false);
      }
    };

    const cleanup = (result) => {
      stdin.removeListener("data", handleKey);
      stdin.setRawMode(false);
      stdin.pause();
      resolve(result);
    };

    stdin.on("data", handleKey);
  });
}

/**
 * 3. MAIN LOGIC
 */
async function main() {
  console.clear();
  console.log(
    `\x1b[1m⚡ Setup Git Hooks\x1b[0m \x1b[2m(Space to select, Enter to confirm)\x1b[0m\n`
  );

  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch {
    console.error("❌ Error: Not inside a Git repository.");
    process.exit(1);
  }

  const choices = Object.keys(TEMPLATES).map((key) => ({
    key,
    name: key,
    desc: TEMPLATES[key].desc,
  }));

  const selectedKeys = await multiselect(choices);

  console.log("\n");

  if (selectedKeys.length === 0) {
    console.log("⚠ No hooks selected. Exiting.");
    process.exit(0);
  }

  const targetDir = path.join(process.cwd(), HOOKS_DIR);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

  // Crear archivos
  selectedKeys.forEach((key) => {
    const filePath = path.join(targetDir, key);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, TEMPLATES[key].content);
      try {
        fs.chmodSync(filePath, "755");
      } catch {}
      console.log(`  \x1b[32m✔\x1b[0m Created \x1b[1m${key}\x1b[0m`);
    } else {
      console.log(
        `  \x1b[33m•\x1b[0m Skipped \x1b[1m${key}\x1b[0m (already exists)`
      );
    }
  });

  // Configurar Git
  try {
    execSync(`git config core.hooksPath ${HOOKS_DIR}`);
    console.log(`\n\x1b[2m✔ Git configured to use ${HOOKS_DIR}\x1b[0m`);
  } catch (e) {
    console.error("❌ Failed to configure git.");
  }

  console.log();
  const shouldStage = await confirm(
    `\x1b[36m?\x1b[0m Do you want to stage these files to Git?`
  );

  if (shouldStage) {
    try {
      execSync(`git add ${HOOKS_DIR}`);
      console.log(`  \x1b[32m✔\x1b[0m Files added to staging area.`);
    } catch (e) {
      console.log(`  \x1b[31m❌\x1b[0m Failed to git add.`);
    }
  } else {
    console.log(`  \x1b[2m•\x1b[0m Skipping git add.`);
  }

  console.log(`\n\x1b[32mDone! Edit your files inside /${HOOKS_DIR}\x1b[0m`);
}

main();
