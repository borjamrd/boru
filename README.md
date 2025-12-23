# ⚡ Boru

> **Zero dependencies. No magic. Just native Git hooks.**
> Scaffolds git hooks directly into your project, inspired by the [shadcn/ui](https://ui.shadcn.com/) philosophy.

[![npm version](https://img.shields.io/npm/v/boru.svg?style=flat-square)](https://www.npmjs.com/package/boru)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

Run the command in the root of your git repository:

```bash
npx boru
```

## 🤔 Why?

Traditional tools like Husky are powerful but often introduce:

1.  **Hidden Abstractions:** Logic buried in `node_modules` or complex configs.
2.  **Runtime Overhead:** Node.js is required just to run a shell command.
3.  **Breaking Changes:** Updates to the tool can break your workflow.

**Boru** takes a different approach. It creates simple, editable shell scripts in a `.boru` folder. Once installed, **you own the code**. You can delete this tool, and your hooks will keep working.

## ✨ Features

- 📦 **Zero Runtime Dependencies:** Your hooks are just shell scripts.
- 🚀 **Native Speed:** Uses Git's native `core.hooksPath`.
- 📝 **Smart Templates:** Includes ready-to-use templates for `pre-commit`, `pre-push` (branch protection), and `commit-msg`.
- 🛠️ **Fully Customizable:** Edit your hooks directly in your editor.
- 🎛️ **Interactive CLI:** Select only the hooks you need (Space to toggle).
- 💾 **Git Control:** The CLI asks if you want to stage the new files to Git automatically.

## 📂 How it works

The CLI guides you through a simple process:

1.  **Selection:** Choose which hooks you want to generate.
2.  **Scaffolding:** Creates the `.boru` folder with executable shell scripts.
3.  **Configuration:** Runs `git config core.hooksPath .boru` locally.
4.  **Staging (Optional):** Asks if you want to run `git add .boru` immediately.

## 📂 Directory Structure

After running the command, your project will look like this:

```
├── .boru
│   ├── pre-commit <-- Edit this file!
│   ├── pre-push
│   └── commit-msg
├── package.json
└── README.md
```

## 🛠️ Usage Example

Open `.boru/pre-commit` and add your logic. It's just a shell script!

```bash
#!/bin/sh

echo "⚡ Running pre-commit checks..."

# 1. Run Linting
npm run lint

# 2. Run Tests
# If this fails (exit code != 0), the commit is aborted.
npm test
```

## 🤝 Team Workflow

Since the hooks are files in your repo, it is recommended to commit them to Git so your team shares the same rules. To ensure every developer on your team has the hooks activated when they clone the repo, add a simple `prepare` script to your `package.json`:

```json
{
  "scripts": {
    "prepare": "git config core.hooksPath .boru || true"
  }
}
```

## 🗑️ Uninstallation

Because there is no magic, "uninstalling" is trivial:

1.  Delete the `.boru` folder.
2.  Run `git config --unset core.hooksPath`.

## 📄 License

MIT © Borja Muñoz

# boru
