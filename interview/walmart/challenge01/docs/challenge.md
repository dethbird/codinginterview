Create a “live” bar that is controlled by a single button and is a width of 400px long. When the user clicks and holds on the button for a period of time, it will create a segment inside and fill the segment a certain color. For example, if we hold down the button for 5 seconds and then release the mouse button, it will “fill in” that segment with the color orange.

In the example below, where each “segment” is the amount of time the button was held down and the color that corresponds to it. If the user picks up their mouse button at any time, the timer and progress bar will stop.

**NOTE: you don’t need to include “5sec” or any text within the segment, only the background color is necessary.**

Here’s a live video demo of it:

[ live box. add a box with seconds the button was held each time ]
[ button - onmouse up calculate time depressed and add a box to the live box ]

Here are the colors you must use for each span of time:

5 seconds or less: orange

6 - 10 seconds: yellow

11 - 15 seconds: green

16 - 20 seconds: blue

## Approach

Yes. This test is perfect for **plain HTML/CSS/JavaScript**. No Vite, no React, no bundler needed.

The prompt only needs a 400px bar, one button, mouse hold timing, colored segments, and stop-on-release behavior.

Create a folder like:

```bash
mkdir live-bar-test
cd live-bar-test
touch index.html styles.css app.js
```

Then run it with either:

```bash
npx serve .
```

or just open `index.html` in the browser.

Core approach:

```jsx
let startTime = null;

button.addEventListener("mousedown", () => {
  startTime = Date.now();
});

button.addEventListener("mouseup", () => {
  const seconds = (Date.now() - startTime) / 1000;
  addSegment(seconds);
});
```

Key implementation idea:

```jsx
function getColor(seconds) {
  if (seconds <= 5) return "orange";
  if (seconds <= 10) return "yellow";
  if (seconds <= 15) return "green";
  return "blue";
}
```

Segment width can be proportional to time:

```jsx
const width = Math.min(seconds / 20 * 400, 400);
```

The interview-safe plan:

1. Build static bar + button.
2. Capture `mousedown`.
3. Capture `mouseup`.
4. Calculate held time.
5. Create a segment div.
6. Set its width and background color.
7. Append it into the bar.
8. Prevent overflow past 400px.

This is exactly the kind of thing you should practice in vanilla JS first. It tests DOM manipulation, events, timing, state, and CSS layout without framework noise.