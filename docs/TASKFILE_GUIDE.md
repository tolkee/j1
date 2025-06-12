# Taskfile Development Guide

This guide covers best practices and common pitfalls when working with Taskfile.yml in this project.

## YAML Syntax Pitfalls

### ⚠️ Colon Issues in Echo Commands

**Problem:** YAML treats colons (`:`) as key-value separators, causing syntax errors in echo commands.

**❌ This will fail:**
```yaml
cmds:
  - echo "URL: http://localhost:3000"
  - echo "Time: 12:30 PM"
```

**✅ Solutions:**

1. **Replace colons with dashes:**
```yaml
cmds:
  - echo "URL - http://localhost:3000"
  - echo "Time - 12:30 PM"
```

2. **Use single quotes inside double quotes:**
```yaml
cmds:
  - echo "URL: 'http://localhost:3000'"
  - echo "Time: '12:30 PM'"
```

3. **Use YAML literal block syntax:**
```yaml
cmds:
  - |
    echo "URL: http://localhost:3000"
    echo "Time: 12:30 PM"
```

### Common Error Messages

When you see:
```
invalid keys in command
file: Taskfile.yml:40:9
> 40 |       - echo "🔗 Convex: http://localhost:3000"
     |         ^
```

This indicates a YAML parsing error due to unescaped colons.

## Task Execution Patterns

### ✅ Correct Patterns

**Sequential tasks:**
```yaml
dev:
  cmds:
    - task: install
    - task: convex:dev
    - task: app:dev
```

**Parallel execution with shell:**
```yaml
dev:
  cmds:
    - |
      # Start services in parallel
      task convex:dev &
      task app:dev
```

**Background processes:**
```yaml
dev:
  cmds:
    - |
      cd convex && pnpm dev &
      cd app && pnpm dev
```

### ❌ Invalid Patterns

**Don't mix task references with shell operators:**
```yaml
# This will fail:
cmds:
  - task: convex:dev &
  - task: app:dev
```

**Don't use bare colons in strings:**
```yaml
# This will fail:
cmds:
  - echo "Server: running"
```

## Best Practices

### 1. Echo Commands
- Avoid colons in echo strings
- Use descriptive emojis for better UX
- Keep messages concise

### 2. Directory Management
- Use `dir:` field instead of `cd` commands when possible
- Be explicit about working directories

### 3. Dependencies
- Use `deps:` for task dependencies
- Keep dependency chains simple

### 4. Error Handling
- Always test tasks after making changes
- Use `task --list` to verify syntax

## Troubleshooting

### Common Issues

1. **"Task does not exist"** - Check task names and dependencies
2. **"Invalid keys in command"** - Check for unescaped colons
3. **"Failed to run task"** - Check shell syntax in multi-line commands

### Testing Tasks

Before committing Taskfile changes:

```bash
# Verify syntax
task --list

# Test specific task
task your-task-name

# Check task help
task --help your-task-name
```

## Examples from This Project

### ✅ Good Examples

```yaml
# Clean and simple
install:
  desc: Install all dependencies for both app and convex
  cmds:
    - task: app:install
    - task: convex:install

# Proper background execution
dev:
  desc: Start development environment (convex + app)
  deps: [install]
  cmds:
    - echo "🚀 Starting development environment..."
    - |
      cd convex && pnpm dev &
      cd app && pnpm dev

# Using dir field
convex:dev:
  desc: Start Convex development server
  dir: convex
  cmd: pnpm dev
```

## Quick Reference

- ✅ Use `dir:` for changing directories
- ✅ Use `|` for multi-line shell commands
- ✅ Replace `:` with `-` in echo strings
- ✅ Test with `task --list` after changes
- ❌ Don't mix `task:` with shell operators like `&`
- ❌ Don't use bare colons in echo commands
- ❌ Don't use `cd` commands when `dir:` works