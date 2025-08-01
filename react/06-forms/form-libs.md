### 📘 Form Libraries: `react-hook-form` & Formik

Using a form library can massively simplify validation, error handling, and performance for complex forms.

------

## 🔹 `react-hook-form`

Lightweight, performant, and uses uncontrolled inputs under the hood.

```bash
npm install react-hook-form
```

### Basic Setup

```tsx
import { useForm } from 'react-hook-form';

type FormData = { name: string; email: string };

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const onSubmit = (data: FormData) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
      />
      {errors.name && <p>{errors.name.message}</p>}

      <input
        {...register('email', {
          required: 'Email required',
          pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
        })}
        placeholder="Email"
      />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Key Features

- **Uncontrolled inputs** = fewer re-renders
- **Built-in validation** via schema or inline rules
- **Tiny bundle size** (< 10KB)
- **Integrates** with Yup/Zod schemas effortlessly

------

## 🔹 Formik

More feature-rich, uses controlled inputs, with an opinionated API.

```bash
npm install formik yup
```

### Basic Setup

```tsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
});

function MyForm() {
  return (
    <Formik
      initialValues={{ name: '', email: '' }}
      validationSchema={validationSchema}
      onSubmit={(values) => console.log(values)}
    >
      <Form>
        <Field name="name" placeholder="Name" />
        <ErrorMessage name="name" component="p" />

        <Field name="email" placeholder="Email" />
        <ErrorMessage name="email" component="p" />

        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
}
```

### Key Features

- **Built-in `<Field>`** and `<ErrorMessage>` components
- **Yup** (or Zod) schema integration for complex validation
- **Easy form-level** and field-level validation
- **More boilerplate** and larger bundle (~30KB+)

------

## 🔸 When to Use Which?

| Criteria                | react-hook-form     | Formik                          |
| ----------------------- | ------------------- | ------------------------------- |
| Bundle size             | Very small (<10KB)  | Larger (~30KB)                  |
| Performance             | Highly performant   | More re-renders                 |
| API simplicity          | Hook-based, minimal | Component-based, opinionated    |
| Validation schemas      | Yup/Zod supported   | Native Yup support              |
| Learning curve          | Low-medium          | Medium                          |
| Complex forms (wizards) | Needs custom wiring | Offers `<FieldArray>` & helpers |

------

## 🧪 Interview-style challenge

**Q:** Build a simple form with a dynamic list of “friends” inputs (add/remove) using your chosen library.

- **react-hook-form**: use `useFieldArray`
- **Formik**: use `<FieldArray>` component

*Check for required names, and console.log the array on submit.*

