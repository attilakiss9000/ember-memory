# HUMAN-FRIENDLY CODE

---

name: human-friendly-code
description: Enforces readable, scannable, and immediately understandable code patterns. Use this skill for all code generation and refactoring tasks.

---

## Goal

To write code that a human developer can read, understand, and modify without needing to decode abbreviations, parse dense one-liners, or mentally decompose complex expressions.

## Instructions

### 1. Variable Naming
- **Minimum 3 characters** for all variables except `i`, `j`, `k` in loop counters.
- **No cryptic abbreviations**: `a` -> `amount`, `r` -> `resources`, `mx` -> `maxAmount`, `lv` -> `level`, `d` -> `data`.
- **Acceptable abbreviations whitelist**: `id`, `db`, `fn`, `cb`, `ref`, `ctx`, `env`, `src`, `dst`, `err`, `req`, `res`, `btn`, `idx`, `num`, `min`, `max`, `len`, `tmp`, `acc`, `val`, `key`, `msg`.
- **Functions**: Use verb-noun pattern (`parseConversation`, `fetchMessages`, `formatTimestamp`).

### 2. One Statement Per Line
- **Never chain statements with semicolons** on one line: `const a = 5; if (a > 3) return;` is forbidden.
- Each statement gets its own line.
- Each `if`, `return`, `const`, `throw` must start on a new line.

### 3. Expression Complexity
- **Break complex formulas into named steps:**
  ```typescript
  // BAD
  messages.filter(m => m.role === 'user' && m.timestamp > cutoff).slice(0, limit)

  // GOOD
  const userMessages = messages.filter(msg => msg.role === 'user');
  const recentMessages = userMessages.filter(msg => msg.timestamp > cutoff);
  const limitedMessages = recentMessages.slice(0, limit);
  return limitedMessages;
  ```
- **Max one ternary per line.** Nested ternaries are forbidden. Use `if/else` instead.
- **Extract complex conditionals into named booleans:**
  ```typescript
  // BAD
  if (msg.role === 'assistant' && msg.content.length > 0 && !msg.deleted) { ... }

  // GOOD
  const isAssistantMessage = msg.role === 'assistant';
  const hasContent = msg.content.length > 0;
  const isActive = !msg.deleted;
  if (isAssistantMessage && hasContent && isActive) { ... }
  ```

### 4. Code Spacing and Grouping
- **Blank line** between logical sections within a function.
- **Section headers** for data objects: `// -- Query parameters --`
- **Group related imports** together (external deps, then internal modules).

### 5. Function Body Readability
- **Extract complex logic** from function bodies into named helper functions.
- **Max 10 lines** inside a callback body. If longer, extract a helper.
- **Name the helper clearly**: `buildSearchQuery`, `formatConversationList`, not `fn1`.

### 6. Repeated Patterns
- When the same pattern appears 3+ times, **extract a factory function or utility**.
- Example: Instead of 5 identical query-building patterns, create `buildPaginatedQuery(table, filters, options)`.

### 7. Data Structure Organization
- **Group entries by category** with section header comments.
- **One property per line** for objects with more than 3 properties.
- **Align values** in related constant objects for visual scanning.

## Constraints
- DO NOT use single-letter variable names outside of loop counters.
- DO NOT chain multiple statements on one line with semicolons.
- DO NOT nest ternaries.
- DO NOT write callbacks longer than 10 lines without extracting helpers.
