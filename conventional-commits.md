# Conventional Commits

*Credit: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)*

## Overview

The Conventional Commits specification is a lightweight convention on top of commit messages that provides an easy set of rules for creating an explicit commit history. This makes it easier to write automated tools and understand project history at a glance.

## Why Use Conventional Commits?

- **Automatic CHANGELOG generation**: Tools can parse commits to generate release notes
- **Semantic versioning**: Automatically determine version bumps based on commit types
- **Clear communication**: Teammates and stakeholders understand changes immediately
- **Structured history**: Makes it easier to explore and understand project evolution
- **CI/CD integration**: Trigger builds and deployments based on commit types

This convention dovetails with [SemVer](http://semver.org/) by describing features (`feat`), fixes (`fix`), and breaking changes in commit messages.

## Basic Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Common Types

- **`feat`**: New feature (→ MINOR version bump)
- **`fix`**: Bug fix (→ PATCH version bump)
- **`docs`**: Documentation changes
- **`style`**: Code formatting (no logic changes)
- **`refactor`**: Code restructuring (no behavior changes)
- **`test`**: Test additions or corrections
- **`chore`**: Maintenance tasks
- **`perf`**: Performance improvements
- **`ci`**: CI/CD changes
- **`build`**: Build system changes

Breaking changes (→ MAJOR version bump) can be indicated with `!` after the type or with a `BREAKING CHANGE:` footer.

## Examples

```
feat(auth): add user authentication
fix(api): resolve login timeout issue
docs: update API documentation
refactor(components): simplify button component
test: add unit tests for user service
chore: update dependencies
feat!: remove deprecated API endpoints
```

## Usage in This Repository

Use the `/commit` slash command in Claude Code to automatically analyze changes and create properly formatted Conventional Commits.

## Resources

- **Official Specification**: [conventionalcommits.org](https://www.conventionalcommits.org/en/v1.0.0/)
- **Semantic Versioning**: [semver.org](http://semver.org/)
- **Angular Convention**: [Angular Contributing Guide](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-guidelines)
- **Commitlint**: [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional)