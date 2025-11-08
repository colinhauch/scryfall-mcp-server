---
description: Examine current changes and create commits using Conventional Commits
---

You will examine all current repository changes and create properly structured commits following the Conventional Commits specification.

## Step 1: Analyze Changes

Run in parallel:
- `git status` - See staged and unstaged files
- `git diff` - View unstaged changes
- `git diff --cached` - View staged changes
- `git log -5 --oneline` - Check recent commit style

## Step 2: Group Changes Logically

Organize changes into separate commits by:
- **Type**: What kind of change (feat, fix, docs, test, etc.)
- **Scope**: What area of codebase (optional but recommended)
- **Relatedness**: Keep related changes together

Common scopes for this repo: `client`, `mcp`, `api`, `types`, `test`, `ci`, `docs`

## Step 3: Create Commits

For each logical group, use this format:

```
<type>[scope]: <description>

[optional body explaining what and why]
```

### Type Reference
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `test` - Test changes
- `refactor` - Code restructuring (no behavior change)
- `perf` - Performance improvement
- `style` - Formatting (no code logic change)
- `chore` - Maintenance (deps, config, etc.)
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

Add ! after type for breaking changes: feat!: or feat(api)!:

### Description Rules
- Present tense, imperative mood: "add" not "added" or "adds"
- Lowercase first letter: "add feature" not "Add feature"
- No period at end
- 50 characters or less
- Be specific but concise

### Body (Optional)
- Separate from description with blank line
- Explain WHAT and WHY, not how
- Wrap at 72 characters
- Use for non-obvious changes

### Examples

Simple:
```
feat(rate-limiting): add exponential backoff for HTTP 429
```

With body:
```
feat(rate-limiting): implement retry logic with exponential backoff

Automatically retries failed requests when Scryfall API returns HTTP
429 status. Uses exponential backoff strategy (1s, 2s, 4s) with
configurable maxRetries and initialBackoff options.
```

Multiple commits:
```
test(client): add rate limiting configuration tests
```

```
docs: update README with rate limiting details
```

## Step 4: Execute Commits

For each commit:
1. Stage relevant files with `git add <files>`
2. Create commit with proper message format (use HEREDOC for formatting)
3. Run `git status` to verify

Use this format for git commit:
```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Optional body explaining changes.
EOF
)"
```

## Important Notes

- Keep commits atomic (one logical change per commit)
- Group related files together
- Separate unrelated changes into different commits
- Don't commit if no changes exist
- Review git status after each commit
- Follow existing commit style from git log
