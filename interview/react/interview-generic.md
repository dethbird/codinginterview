When a company says **“frontend heavy”** and you already know React, they’re usually signaling that they’ll focus on **UI architecture, state management, and React-specific reasoning**—not just generic JavaScript or algorithms.

Here’s how those interviews usually break down:

---

### 💬 **1. Conceptual / Theoretical Questions**

You’ll often get a lot of these to gauge depth of understanding. Expect “why” and “how” style questions that explore React under the hood.

**Examples:**

1. What’s the difference between **controlled** and **uncontrolled** components?
2. How does **React’s reconciliation (diffing) algorithm** work?
3.  What triggers a **re-render** in React, and how can you avoid unnecessary renders?
4. How does **React.memo** work? What are its pitfalls?
5. Explain **useEffect**’s dependency array and common mistakes.
6. How would you manage **global state**? When do you pick Context vs Redux vs Zustand?
7.  What’s the difference between **server-side rendering**, **client-side rendering**, and **hydration**?
8.  What’s **suspense** and how does it tie in with **React.lazy**?
9.  How would you handle **error boundaries** or async errors in React components?
10. How do you optimize performance in a large React app?
11. How do you handle accessibility and keyboard navigation in React components?

---

### 🧠 **2. Practical or “Whiteboard” Questions**

Some interviews involve walking through React-like logic **without a full environment**. These test whether you understand the component model.

**Examples:**

1. Given a list of items, how would you render them and handle user input filtering?
2. Implement a custom **hook** like `useFetch` or `usePrevious`.
3. How would you debounce an input field in React?
4. Write a **toggle component** that remembers its state across re-renders.
5. Create a parent and child component where the parent can trigger a child action via **refs or callbacks**.

*(Tip: keep your answers close to the mental model — describe how you’d approach it, then write code if asked.)*

---

### 💻 **3. Take-Home or Live Coding Tests**

Many “frontend heavy” interviews include a **small coding project** or **pairing session** where you actually build or fix something React-y.

**Common exercises:**

* Build a simple **todo list** or **search UI** from scratch with hooks.
* Fetch API data and render a paginated table.
* Add filtering/sorting to an existing list.
* Debug a small React app with a rendering or state bug.
* Implement a modal, dropdown, or tab system (tests controlled/uncontrolled behavior).
* Optimize an app suffering from too many re-renders (tests memoization and profiling).

*(They’re usually time-boxed, around 45–90 minutes. Some companies also let you take home a repo and return it later.)*

---

### ⚙️ **4. Frontend Systems / Architecture Questions**

For senior or full-stack roles that say “frontend heavy,” they might also ask how you **structure and scale** large apps.

**Examples:**

* How do you organize components and hooks for reuse?
* How do you approach styling (CSS Modules, Styled Components, Tailwind, etc.)?
* How do you handle authentication or routing in React?
* How would you architect a component library or design system?
* How do you integrate GraphQL or REST APIs in React efficiently?
* What would you do if you had to migrate a legacy React app to hooks or TypeScript?

---

### 🔍 **Real-World Tip**

The format often depends on the company:

* **Agencies / product teams** → hands-on coding test or screen-share.
* **Big tech** → conceptual + systems questions.
* **Startups** → pragmatic: “Here’s a component, how would you fix/add X?”

You might get a **mix**: a live coding session using CodeSandbox, and a few theoretical questions.

---

If you tell me the company or job posting (or whether it’s a coding screen vs technical interview), I can mock up a few *realistic* sample questions and even a **mini React coding test** that mirrors what they’re likely to do.

Would you like me to make one? (e.g. a 30-min realistic React interview prompt + follow-up questions on hooks and performance)
