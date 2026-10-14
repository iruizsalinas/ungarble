// The only nonportable behavioral file mocks repair rules with Vitest spies.
// Architecture, native worker orchestration and browser hosts have separate jobs.
export const sharedInclude = ["test/integration/**/*.test.ts", "test/unit/**/*.test.ts", "test/security/**/*.test.ts"];
export const sharedExclude = ["test/unit/encoding/budgets.test.ts"];
