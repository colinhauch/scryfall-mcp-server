# Conventional Commits Specification for LLM Agent

*Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)*

## Overview

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history, which makes it easier to write automated tools on top of. This convention dovetails with [SemVer](http://semver.org/), by describing the features, fixes, and breaking changes made in commit messages.

## Commit Message Structure

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Core Types

The commit contains the following structural elements to communicate intent:

1. **`fix:`** - patches a bug in your codebase (correlates with [PATCH](http://semver.org/#summary) in Semantic Versioning)
2. **`feat:`** - introduces a new feature to the codebase (correlates with [MINOR](http://semver.org/#summary) in Semantic Versioning)
3. **`BREAKING CHANGE:`** - introduces a breaking API change (correlates with [MAJOR](http://semver.org/#summary) in Semantic Versioning). Can be part of commits of any type.

## Additional Common Types

Types other than `fix:` and `feat:` are allowed. The [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) (based on the [Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)) recommends:

- `build:` - Changes that affect the build system or external dependencies
- `chore:` - Other changes that don't modify src or test files
- `ci:` - Changes to CI configuration files and scripts
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Code changes that improve performance
- `test:` - Adding missing tests or correcting existing tests

## Examples

### Commit message with description and breaking change footer
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### Commit message with `!` to draw attention to breaking change
```
feat!: send an email to the customer when a product is shipped
```

### Commit message with scope and `!` to draw attention to breaking change
```
feat(api)!: send an email to the customer when a product is shipped
```

### Commit message with both `!` and BREAKING CHANGE footer
```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### Commit message with no body
```
docs: correct spelling of CHANGELOG
```

### Commit message with scope
```
feat(lang): add Polish language
```

### Commit message with multi-paragraph body and multiple footers
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

### Revert commit example
```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

## Specification Rules

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

1. Commits **MUST** be prefixed with a type, followed by the OPTIONAL scope, OPTIONAL `!`, and REQUIRED terminal colon and space.
2. The type `feat` **MUST** be used when a commit adds a new feature.
3. The type `fix` **MUST** be used when a commit represents a bug fix.
4. A scope **MAY** be provided after a type. A scope **MUST** consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., `fix(parser):`
5. A description **MUST** immediately follow the colon and space after the type/scope prefix.
6. A longer commit body **MAY** be provided after the short description, providing additional contextual information. The body **MUST** begin one blank line after the description.
7. A commit body is free-form and **MAY** consist of any number of newline separated paragraphs.
8. One or more footers **MAY** be provided one blank line after the body. Each footer **MUST** consist of a word token, followed by either a `:<space>` or `<space>#` separator, followed by a string value (inspired by the [git trailer convention](https://git-scm.com/docs/git-interpret-trailers)).
9. A footer's token **MUST** use `-` in place of whitespace characters, e.g., `Acked-by`. An exception is made for `BREAKING CHANGE`.
10. A footer's value **MAY** contain spaces and newlines, and parsing **MUST** terminate when the next valid footer token/separator pair is observed.
11. Breaking changes **MUST** be indicated in the type/scope prefix of a commit, or as an entry in the footer.
12. If included as a footer, a breaking change **MUST** consist of the uppercase text `BREAKING CHANGE`, followed by a colon, space, and description.
13. If included in the type/scope prefix, breaking changes **MUST** be indicated by a `!` immediately before the `:`. If `!` is used, `BREAKING CHANGE:` **MAY** be omitted from the footer section.
14. Types other than `feat` and `fix` **MAY** be used in commit messages.
15. The units of information that make up Conventional Commits **MUST NOT** be treated as case sensitive by implementors, with the exception of `BREAKING CHANGE` which **MUST** be uppercase.
16. `BREAKING-CHANGE` **MUST** be synonymous with `BREAKING CHANGE`, when used as a token in a footer.

## Benefits of Using Conventional Commits

- Automatically generating CHANGELOGs
- Automatically determining a semantic version bump (based on the types of commits landed)
- Communicating the nature of changes to teammates, the public, and other stakeholders
- Triggering build and publish processes
- Making it easier for people to contribute to your projects, by allowing them to explore a more structured commit history

## Semantic Versioning Relationship

- `fix` type commits should be translated to `PATCH` releases
- `feat` type commits should be translated to `MINOR` releases  
- Commits with `BREAKING CHANGE`, regardless of type, should be translated to `MAJOR` releases

## FAQ Highlights

### Case Sensitivity
Any casing may be used for types, but it's best to be consistent.

### Multiple Commit Types
If a commit conforms to more than one type, go back and make multiple commits whenever possible.

### Wrong Commit Type
- **Before merging:** Use `git rebase -i` to edit the commit history
- **After release:** The cleanup will depend on your tools and processes
- **Wrong type entirely:** It's not the end of the world - tools will just miss that commit

### Revert Commits
Use the `revert` type with a footer referencing the commit SHAs being reverted.

## Quick Reference for LLM Agent

When creating commit messages, follow this pattern:

1. **Start with a type** (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.)
2. **Add scope if applicable** in parentheses (e.g., `feat(api):` or `fix(parser):`)
3. **Add `!` for breaking changes** (e.g., `feat!:` or `feat(api)!:`)
4. **Write a clear, concise description** in present tense
5. **Add body if needed** after a blank line for additional context
6. **Add footers if needed** for references, breaking changes, etc.

### Common Patterns:
- `feat: add user authentication`
- `fix(auth): resolve login timeout issue`
- `docs: update API documentation`
- `refactor(components): simplify button component`
- `test: add unit tests for user service`
- `chore: update dependencies`
- `feat!: remove deprecated API endpoints`

Remember: Use present tense, be descriptive but *concise*, and always indicate breaking changes clearly.

---

*For full specification details, visit: https://www.conventionalcommits.org/en/v1.0.0/#specification*