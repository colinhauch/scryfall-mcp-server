# Contributing to Scryfall MCP Server

## Branching Strategy

This project uses a three-branch workflow to maintain code quality and stability:

### Branch Overview

| Branch | Purpose | Stability | Deployment |
|--------|---------|-----------|------------|
| `main` | Production-ready code | Highest | Auto-deploys to Cloudflare Workers |
| `test` | Staging/QA testing | High | No deployment |
| `dev` | Active development | Moderate | No deployment |

### Development Workflow

#### 1. Starting New Work

Always branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

#### 2. During Development

- Make commits following [Conventional Commits](https://www.conventionalcommits.org/)
- Run tests and linting before committing:
  ```bash
  npm test
  npm run lint:fix
  npm run type-check
  ```

#### 3. Creating Pull Requests

Use the `/create-pr` slash command, which defaults to the `test` branch:

```bash
# Create PR to test branch (default)
/create-pr

# Or specify target branch explicitly
/create-pr test
```

The command will:
- Analyze all commits since branching
- Generate a comprehensive PR summary
- Create the PR with proper formatting

#### 4. Review and Testing

- PRs to `test` require review and passing CI checks
- Once merged to `test`, validate changes in the staging environment
- If issues are found, create a fix branch from `test`

#### 5. Promoting to Production

Once changes are validated in `test`:

```bash
git checkout test
/create-pr main
```

This creates a PR from `test` → `main`. After approval and merge, changes automatically deploy to production.

## Branch Protection Rules

**Never commit directly to:**
- `main` - Production code only via PR from `test`
- `test` - Staging code only via PR from feature branches

**Always work on:**
- Feature branches created from `dev`

## CI/CD Pipeline

### Continuous Integration

All PRs run:
1. Biome format check
2. Biome lint
3. TypeScript type check
4. Vitest tests

### Deployment

- **Automatic**: Pushes to `main` trigger Cloudflare Workers deployment
- **Manual**: Run `npm run deploy` if needed (discouraged)

## Feature Branch Naming

Use descriptive prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

Examples:
- `feat/add-card-search`
- `fix/rate-limit-retry`
- `refactor/client-error-handling`

## Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting:

```bash
npm run format      # Auto-format code
npm run lint:fix    # Auto-fix linting issues
```

Configuration is in `biome.json`.

## Testing

- All new features must include tests
- Tests use real Scryfall API calls (integration tests)
- Run tests before creating PRs:

```bash
npm test                # Run once
npm run test:watch      # Watch mode during development
npm run test:coverage   # Generate coverage report
```

## Questions?

- Check [CLAUDE.md](./CLAUDE.md) for detailed architecture and development docs
- Review existing PRs for examples of good commit messages and PR descriptions