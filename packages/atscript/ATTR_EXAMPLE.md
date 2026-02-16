# Custom Attributes/Props with @foorm.attr

The `@foorm.attr` and `@foorm.fn.attr` annotations allow you to pass custom HTML attributes or component props to rendered fields.

## Static Attributes

Use `@foorm.attr` with comma-separated name and value:

```typescript
interface ProfileForm {
  /**
   * @meta.label Email Address
   * @foorm.type text
   * @foorm.attr 'data-testid', 'email-input'
   * @foorm.attr 'aria-label', 'Email address field'
   * @foorm.attr 'maxlength', '50'
   */
  email: string

  /**
   * @meta.label Password
   * @foorm.type password
   * @foorm.attr 'variant', 'outlined'
   * @foorm.attr 'size', 'large'
   */
  password: string
}
```

## Computed Attributes

Use `@foorm.fn.attr` for dynamic values (name, function):

```typescript
interface RegistrationForm {
  /**
   * @meta.label Phone Number
   * @meta.placeholder '+1 (555) 123-4567'
   * @foorm.type text
   * @foorm.fn.attr 'data-valid', '(v) => v && v.length >= 10 ? "true" : "false"'
   * @foorm.fn.attr 'aria-invalid', '(v) => !v || v.length < 10 ? "true" : "false"'
   */
  phone?: string

  /**
   * @meta.label Password
   * @foorm.type password
   * @foorm.fn.attr 'data-strength', '(v) => v.length > 8 ? "strong" : "weak"'
   * @foorm.fn.attr 'aria-invalid', '(v, data, ctx, entry) => !entry.optional && !v'
   */
  password: string
}
```

## Mixed (Static + Computed)

Computed attrs override static attrs with the same name:

```typescript
interface MembershipForm {
  /**
   * @meta.label Membership Level
   * @foorm.type text
   * @foorm.attr 'data-tier', 'basic'
   * @foorm.fn.attr 'data-tier', '(v, data) => data.agreeToTerms ? "premium" : "basic"'
   * @foorm.attr 'data-static', 'always-present'
   */
  membershipLevel?: string
}
```

## How It Works

1. **Static attrs** are defined with `@foorm.attr 'name', 'value'`
2. **Computed attrs** are defined with `@foorm.fn.attr 'name', 'function'`
3. All attrs are collected into the field's `attrs` object
4. In Vue components, attrs are spread onto the component via `v-bind="field.attrs"`
5. Computed attrs override static attrs with the same name

## Use Cases

- **Testing**: Add `data-testid` for E2E tests
- **Accessibility**: Add ARIA attributes dynamically
- **UI Components**: Pass variant, size, color props
- **Analytics**: Add tracking attributes
- **Custom Behavior**: Pass any custom props to your components
