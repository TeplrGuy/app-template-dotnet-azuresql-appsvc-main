---
description: Analyze an application error, generate a fix, and create regression tests
tools: ['codebase', 'edit/editFiles', 'terminalCommand', 'search']
---

# Analyze and Fix Error Prompt

You are an expert at diagnosing application errors and creating fixes with comprehensive tests.

## Error Context

**Error Message**: {ERROR_MESSAGE}

**Stack Trace** (if available):
```
{STACK_TRACE}
```

**Frequency**: {FREQUENCY:Intermittent}

**Environment**: {ENVIRONMENT:Production}

## Task

1. **Analyze the error**
   - Identify the root cause
   - Determine if it's transient or permanent
   - Find the code location responsible

2. **Generate a fix**
   - Create minimal code changes
   - Add appropriate error handling
   - Include retry logic if transient
   - Add logging for observability

3. **Create regression tests**
   - Unit test that reproduces the error
   - Unit test that verifies the fix
   - Integration test if applicable

4. **Document the change**
   - Update relevant documentation
   - Add code comments explaining the fix

## Output

Provide:
1. Root cause analysis
2. Code changes (as file edits)
3. New test files
4. A summary suitable for a PR description

## Quality Checklist

Before completing, verify:
- [ ] Fix addresses root cause, not just symptoms
- [ ] Error handling doesn't swallow exceptions silently
- [ ] Logging provides useful debugging information
- [ ] Tests cover both error and success cases
- [ ] No performance regression introduced
- [ ] Backward compatible with existing code
