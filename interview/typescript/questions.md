Heck yes—let’s turn TypeScript from “I’ve used it” into “I can spar with a cranky staff engineer about variance before coffee.” Below is a curated set of **theoretical** and **practical** questions you’ll see at mid→senior frontend-heavy full-stack interviews. No answers now—just the prompts. You’ll reply with your answer to Q1, and I’ll grade it: what you nailed, what you missed, key technical details, and then a polished interview-ready answer.

---

# Theory (warm-up → deep cuts)

### Core & Everyday Use

1. **Any vs unknown vs never:** When do you use each, and why does `unknown` exist if `any` already does?
2. **Type aliases vs interfaces:** Where are they interchangeable, where do they differ (merging, recursion, unions), and how do you choose?
3. **Structural typing:** Explain with an example where it helps and where it bites (excess property checks, accidental compatibility).
4. **Narrowing:** Walk through control-flow based narrowing (type guards, `in`, `typeof`, `instanceof`, discriminants).
5. **Union vs intersection types:** Practical differences and a pitfall for each.
6. **Enum vs union of literals:** Tradeoffs, tree-shaking, and interop considerations.

### Generics & Inference

7. **Generic functions and constraints:** Show how `extends` constraints work and when to prefer defaults (`<T = …>`).
8. **Inference from usage:** How does TypeScript infer generics from arguments & return types? What’s “best common type”?
9. **Variance:** What does it mean here? Give a React-prop style example where variance matters.
10. **Overloads vs generics:** When are overloads clearer? When are they a smell?

### Utility & Advanced Types

11. **Mapped & conditional types:** Show how to build `Writable<T>`, `NonNullableKeys<T>`, or `DeepPartial<T>`.
12. **Template literal types:** Real-world example (CSS props, event name patterns, REST endpoints).
13. **Key remapping in mapped types:** Why it’s powerful; show a rename or filter of keys.
14. **`satisfies` vs `as const`:** Explain each and when they’re complementary.
15. **Discriminated unions:** How to design them for exhaustive checks and ergonomics.
16. **Branded/opaque types:** Create “UserId” vs “string” without runtime cost; why it helps.
17. **Declaration merging & module augmentation:** When you’d extend a third-party lib’s types safely.

### Tooling & Config

18. **`tsconfig` essentials:** What do `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `skipLibCheck` change?
19. **`esModuleInterop`, `moduleResolution`, ESM vs CJS:** Common interop gotchas and fixes.
20. **Performance & compile-time:** Techniques for taming slow type computation or huge monorepos.
21. **Source of truth:** Types vs runtime validation (Zod/Valibot/typia). Where to put boundaries.

### Frontend/React-specific

22. **Typing React props/state/hooks:** Patterns for `useState`, `useRef`, `useReducer` with discriminated actions.
23. **Context & generics:** Type a Context that’s safe pre-provider and supports generics.
24. **Event handlers & DOM types:** Correctly typing `onChange`, `onClick`, and custom DOM events.
25. **Reusable components with generics:** e.g., a typed `<Select<Option>>` with value/label inference.
26. **Third-party state libs:** Typing Redux Toolkit slices/thunks or TanStack Query hooks cleanly.

### Node/Full-stack edges

27. **Typing fetch/axios layer:** End-to-end types for request params and response parsing with runtime guards.
28. **Serializability & JSON:** What is (and isn’t) JSON-safe? How to express `JsonValue` types.
29. **Error typing & async:** `unknown` errors, `Promise` utilities (`Awaited`, `Thenable`), and typed `try/catch`.
30. **Working with legacy JS:** Strategies to add TS incrementally, ambient types, `d.ts` authoring basics.

---

# Practical (coding/exercise prompts)

### Utility Types & Type-level

P1) **`DeepReadonly<T>`:** Implement recursively while preserving functions as callable.
P2) **`Merge<A,B>`:** Deep merge where `B` overrides overlapping keys (objects only).
P3) **`JsonValue` type:** A precise recursive type for JSON-serializable values.
P4) **`KeysWithValue<T, V>`:** Return keys of `T` whose values are assignable to `V`.
P5) **`RequiredBy<T, K>` / `PartialBy<T, K>`:** Toggle optionality by key subset.

### React/Frontend

P6) **Typed reducer:** Build a `useReducer` with a discriminated `Action` and exhaustive `switch` helper.
P7) **Typed `Select` component:** Generic `<Select<Option>>` that infers `value` and `label` from `Option`.
P8) **Event typing:** Write a `handleChange` for `<input>` and `<select>` that preserves the specific target type.
P9) **Context with safety:** Create `createSafeContext<T>()` that throws if used outside a provider, fully typed.

### Full-stack/Data

P10) **Fetch wrapper with validation:** `fetchJson<T>` that accepts a Zod schema, narrows to `T`, and maps errors.
P11) **Query-string parser/serializer:** Strongly typed `parseQuery<T>()` and `stringifyQuery<T>()` for a known schema.
P12) **Typed Pub/Sub bus:** `on`, `emit`, `off` for an `Events` map where `emit('user:login', payload)` is type-checked.

---

## How we’ll work

* Reply with your answer to **Q1** (Theory: “Any vs unknown vs never”).
* I’ll respond with: **What you got right → What you missed → Technical details → A polished interview answer** you can say out loud.
* We’ll move in order unless you specify a different question number.
* If you want coding, reference a **P#** and paste your solution—I’ll review with tests in mind and suggest refinements.

Ready when you are—hit me with Q1.
