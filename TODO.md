## Persist variants when switching

When user has union with multiple variants and switches from one to another, we have to persist the state of previous variant data in case if user switches back to it.
We can persist it in oo-union component, but it will be better if we persist it somehow in the core, so users when developing custom union component can have persisted data when switching variants.

## Change events

Each change (field input (blur), add/remove item, switch variant) should emit an event from form with:

- formData
- change path
- new value

(to let some room for undo/redo flows in future)

