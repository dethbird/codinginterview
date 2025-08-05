### 📘 Modal Component

Modals are common UI components that show content overlaying the main page.

------

## 🔹 Basic Controlled Modal

```tsx
import { useState } from 'react';

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={onClose} // close on backdrop click
    >
      <div
        style={{ backgroundColor: 'white', padding: 20 }}
        onClick={e => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
        <button onClick={onClose} aria-label="Close modal">Close</button>
      </div>
    </div>
  );
};

const App = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2>Modal Title</h2>
        <p>Modal Content</p>
      </Modal>
    </>
  );
};
```

------

## 🔹 Accessibility Notes

- Use `role="dialog"` and `aria-modal="true"` on the modal container
- Trap focus inside modal (advanced)
- Close modal on ESC key (advanced)

------

## 🧪 Interview-style challenge

**Q:** How would you enhance this modal to trap focus and close on ESC?

