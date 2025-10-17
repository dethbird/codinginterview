# Copilot Instructions for CodingInterview Repository

## Big Picture Architecture
- This repo is a reference and interview prep resource, organized by language and topic: `notes/`, `interview/`, and `env/`.
- Each language (`node`, `php`, `react`, `typescript`) has its own subfolder in `notes/` and `interview/` with topic-based markdown files and cheat sheets.
- The `env/virtualbox-php-react/` folder contains setup guides for local dev environments, especially for PHP/React on Ubuntu via VirtualBox.

## Developer Workflows
- No build/test automation scripts are present; content is primarily markdown for study/reference.
- For environment setup, follow step-by-step instructions in `env/virtualbox-php-react/README.md` (e.g., Ubuntu install, SSH, PHP/Composer setup).
- Code snippets and explanations are found in topic markdown files, not runnable codebases.

## Project-Specific Conventions
- All technical notes are organized by numbered folders (e.g., `01-runtime-basics`, `02-async-patterns`) for easy navigation.
- Each topic folder contains a README and subtopics as separate markdown files.
- Interview questions and answers are split by language and type (e.g., `interview/typescript/questions.md`, `answers.01.core/`).
- Use relative links for cross-referencing topics (see `notes/node/README.md` for examples).

## Integration Points & Patterns
- No direct code integration; markdown files are cross-linked for reference.
- Environment setup instructions may reference external resources (e.g., Ubuntu, Composer, PHP extensions).
- No custom scripts, build tools, or test runners are present.

## Examples
- See `notes/node/README.md` for Node.js event loop, async patterns, and module system explanations.
- See `notes/react/README.md` for React fundamentals, hooks, and component patterns.
- See `env/virtualbox-php-react/README.md` for full dev environment setup.

## Guidance for AI Agents
- Focus on generating, updating, or linking markdown content for interview prep and technical notes.
- When adding new topics, follow the numbered folder and file naming conventions.
- Reference existing markdown files for style and structure.
- Do not add build scripts, test runners, or executable code unless explicitly requested.
- For environment setup, update instructions in `env/virtualbox-php-react/README.md`.

---

If any section is unclear or missing, please ask for clarification or provide feedback to improve these instructions.