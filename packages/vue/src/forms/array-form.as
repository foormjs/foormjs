@foorm.title 'Array Examples'
@foorm.submit.text 'Save'
export interface ArrayForm {
    @meta.label 'Name'
    @meta.placeholder 'Project name'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "Name is required"'
    @foorm.order 1
    name: string

    // ── Simple string array ──────────────────────────────
    @meta.label 'Tags'
    @foorm.order 2
    @foorm.array.add.label 'Add tag'
    @foorm.array.remove.label 'x'
    @expect.maxLength 5, 'Maximum 5 tags'
    tags: string[]

    // ── Simple number array ──────────────────────────────
    @meta.label 'Scores'
    @foorm.order 3
    @foorm.array.add.label 'Add score'
    @expect.minLength 1, 'At least one score required'
    @expect.maxLength 10, 'Maximum 10 scores'
    scores: number[]

    // ── Object array (addresses) ─────────────────────────
    @meta.label 'Addresses'
    @foorm.title 'Addresses'
    @foorm.order 4
    @foorm.array.add.label 'Add address'
    @foorm.array.remove.label 'Remove address'
    addresses: {
        @meta.label 'Street'
        @meta.placeholder '123 Main St'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "Street is required"'
        street: string

        @meta.label 'City'
        @meta.placeholder 'New York'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "City is required"'
        city: string

        @meta.label 'ZIP'
        @meta.placeholder '10001'
        @foorm.type 'text'
        zip?: string
    }[]

    // ── Grouped nested object (not an array) ─────────────
    @foorm.title 'Settings'
    @foorm.order 5
    settings: {
        @meta.label 'Notify by email'
        @foorm.order 1
        emailNotify: foorm.checkbox

        @meta.label 'Max items per page'
        @foorm.type 'number'
        @foorm.order 2
        @expect.min 1, 'At least 1'
        @expect.max 100, 'At most 100'
        pageSize?: number
    }

    // ── Union array (mixed types) ────────────────────────
    @meta.label 'Contacts'
    @foorm.title 'Contacts'
    @foorm.order 6
    @foorm.array.add.label 'Add contact'
    contacts: ({
        @meta.label 'Full Name'
        @meta.placeholder 'Jane Doe'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "Name is required"'
        fullName: string

        @meta.label 'Email'
        @meta.placeholder 'jane@example.com'
        @foorm.type 'text'
        email?: string.email

        @meta.label 'Phone'
        @meta.placeholder '+1 555 0123'
        @foorm.type 'text'
        phone?: string
    } | string)[]
}
