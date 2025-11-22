# Contributing to UpCoach

Thank you for your interest in contributing to UpCoach! This document provides guidelines and information for contributors.

## 🚀 Quick Start

If you're new to the project, start here:

1. **[Quick Start Guide](docs/getting-started/QUICK_START.md)** - Get running in 5 minutes
2. **[Project Overview](docs/getting-started/PROJECT_OVERVIEW.md)** - Understand the architecture
3. **[Development Setup](docs/getting-started/DEVELOPMENT_SETUP.md)** - Complete environment setup
4. **[Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Learn workflows and best practices

## 📋 Development Workflow

### Before Making Changes

1. **Read the documentation** - Familiarize yourself with the codebase
2. **Check current status** - Review [CURRENT_STATUS.md](../CURRENT_STATUS.md) for project state
3. **Ensure tests pass** - Run `npm test` before making changes
4. **Follow established patterns** - See [Test Patterns](docs/testing/TEST_PATTERNS.md)
5. **Maintain test coverage** - Keep coverage at 99%+ (current: 99.7%)

### Making Changes

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the established patterns

3. **Write comprehensive tests** for new functionality

4. **Run the full test suite**
   ```bash
   npm run test:coverage  # Should show 99%+ coverage
   ```

5. **Update documentation** if needed

6. **Commit with clear messages**
   ```bash
   git commit -m "feat: add user profile management

   - Add profile update endpoint
   - Add profile validation
   - Update user model
   - Add comprehensive tests"
   ```

### Code Review Standards

- ✅ **All code must have test coverage**
- ✅ **Follow TypeScript/ESLint best practices**
- ✅ **Document complex business logic**
- ✅ **Zero failing tests**
- ✅ **Clear commit messages**
- ✅ **PR description explains changes**

## 🧪 Testing Standards

UpCoach maintains **99.7% test coverage** with **1023/1026 tests passing**. New code must:

- Include unit tests for all functions
- Include integration tests for API endpoints
- Include E2E tests for user journeys
- Maintain or improve test coverage

### Test Types

- **Unit Tests**: Component and function-level testing
- **Integration Tests**: API and service integration
- **E2E Tests**: Full user journey testing with Playwright
- **Contract Tests**: API contract validation

## 📚 Documentation

### For Contributors

- **[Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Complete development workflows
- **[Testing Overview](docs/testing/TESTING_OVERVIEW.md)** - Testing standards and metrics
- **[Test Patterns](docs/testing/TEST_PATTERNS.md)** - Established testing patterns
- **[Architecture](docs/getting-started/PROJECT_OVERVIEW.md)** - System design and patterns

### Updating Documentation

- Keep documentation current with code changes
- Use clear, concise language
- Include code examples where helpful
- Test documentation instructions

## 🐛 Reporting Issues

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, etc.)
- **Screenshots/logs** if applicable

## 💡 Feature Requests

Feature requests should include:

- **Problem statement** - What's the problem you're trying to solve?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other approaches did you think about?
- **Additional context** - Any other relevant information

## 📝 Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: add user authentication system
fix: resolve memory leak in image processing
docs: update API documentation for v2.0
test: add integration tests for payment processing
```

## 🎯 Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: All rules must pass
- **Prettier**: Consistent code formatting
- **Test Coverage**: Minimum 99% coverage required
- **Security**: Regular security scans and audits

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers learn and contribute
- Focus on solutions, not blame

## 📞 Getting Help

- **Documentation**: [Complete Index](docs/INDEX.md)
- **Current Status**: [Project Status](../CURRENT_STATUS.md)
- **Security**: [Security Guide](docs/SECURITY.md)

---

**Thank you for contributing to UpCoach!** 🎉

Your contributions help make this platform better for users worldwide.
