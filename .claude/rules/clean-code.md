# CLEAN CODE ARCHITECTURE

---

name: clean-code-architecture
description: Enforces SOLID design principles and foundational clean code practices (DRY, KISS, readable naming, low complexity). Use this skill when writing core business logic, utility functions, or when performing general code quality refactoring.

---

## Goal

To write software that is highly readable, easily maintainable, and built on sound architectural foundations. Complexity should be minimized at all costs.

## Instructions

### 1. Core Clean Code Rules

- **Meaningful Names:** Variables, functions, and classes must clearly reveal their purpose. Do not use cryptic abbreviations (e.g., use `userCount` instead of `usrCnt`) or generic names like `data` or `manager`.
- **DRY (Don't Repeat Yourself):** Duplicate code is strictly forbidden. Extract common logic into reusable methods, hooks, or modules immediately.
- **KISS (Keep It Simple, Stupid):** Avoid over-engineering. Write the simplest code possible that satisfies the requirement.
- **Avoid Deep Nesting:** Minimize nested structures (`if`/`else`, loops). Use early returns (guard clauses) to keep the "happy path" at the outermost indentation level.
- **Comments with Purpose:** Code must be self-documenting via good naming. Only use comments to explain _why_ a specific approach was taken, never _what_ the code is doing.
- **Avoid Magic Numbers:** Replace hard-coded literals (numbers or strings) with named constants to provide clear context (e.g., `const MAX_RETRIES = 3`).
- **Consistent Formatting:** Follow standard styling and formatting conventions so the codebase appears unified.

### 2. SOLID Principles

- **Single Responsibility Principle (SRP):** A function, class, or module should do exactly one thing, do it well, and have only one reason to change.
- **Open/Closed Principle (OCP):** Software entities should be open for extension but closed for modification. Use interfaces or composition to add new features without altering existing, tested code.
- **Liskov Substitution Principle (LSP):** Subtypes must be substitutable for their base types without breaking application logic.
- **Interface Segregation Principle (ISP):** Do not force components to depend on interfaces or props they do not use. Keep interfaces small and focused.
- **Dependency Inversion Principle (DIP):** High-level modules should not depend on low-level modules; both should depend on abstractions.

## Constraints

- DO NOT nest logic more than 3 levels deep. Use early returns.
- DO NOT duplicate logic; abstract it immediately.
- DO NOT leave magic numbers or undocumented complex regex in the code.
