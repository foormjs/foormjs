@foorm.fn.title '(data) => "User " + (data.firstName || "<unknown>")'
@foorm.submit.text 'Register'
@foorm.fn.submit.disabled '(data) => !data.firstName || !data.lastName'
export interface E2eTestForm {
    // Paragraph primitive
    @meta.label 'Welcome'
    @foorm.value 'Please fill out this form'
    @foorm.order 0
    info: foorm.paragraph

    // Text field: label, description, placeholder, autocomplete, validate, order
    @meta.label 'First Name'
    @meta.description 'Your given name'
    @meta.placeholder 'John'
    @foorm.type 'text'
    @foorm.autocomplete 'given-name'
    @foorm.validate '(v) => !!v || "First name is required"'
    @foorm.order 1
    firstName: string

    // Text field: hint, computed placeholder, validate
    @meta.label 'Last Name'
    @meta.hint 'Real last name please'
    @foorm.fn.placeholder '(v, data) => data.firstName ? "Same as " + data.firstName + "?" : "Doe"'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "Last name is required"'
    @foorm.order 2
    lastName: string

    // Number field: default value, @expect.min validation
    @meta.label 'Age'
    @foorm.type 'number'
    @foorm.value '25'
    @foorm.order 3
    @foorm.validate '(v) => !!v || "Age is required"'
    @expect.min 18, 'Must be 18 or older'
    age: number

    // Text field: computed label, computed description
    @foorm.fn.label '(v, data) => data.firstName ? data.firstName + "s Email" : "Email"'
    @foorm.fn.description '(v, data) => data.firstName ? "We will contact " + data.firstName + " here" : "Your email address"'
    @foorm.type 'text'
    @foorm.autocomplete 'email'
    @foorm.order 4
    email?: string.email

    // Text field: computed hint
    @meta.label 'Nickname'
    @foorm.fn.hint '(v, data) => v ? "Nice nickname, " + (data.firstName || "stranger") + "!" : "Choose a cool nickname"'
    @foorm.type 'text'
    @foorm.order 5
    nickname?: string

    // Password field: computed disabled
    @meta.label 'Password'
    @meta.placeholder 'Enter password'
    @foorm.type 'password'
    @foorm.fn.disabled '(v, data) => !data.firstName || !data.lastName'
    @foorm.validate '(v) => !!v || "Password is required"'
    @foorm.order 6
    password: string

    // Text field: computed hidden
    @meta.label 'Secret Code'
    @foorm.type 'text'
    @foorm.fn.hidden '(v, data) => !data.password'
    @foorm.order 7
    secretCode?: string

    // Static hidden
    @meta.label 'Hidden Field'
    @foorm.type 'text'
    @foorm.hidden
    @foorm.order 8
    hiddenField?: string

    // Static disabled
    @meta.label 'Disabled Field'
    @foorm.type 'text'
    @foorm.disabled
    @foorm.value 'cannot edit'
    @foorm.order 9
    disabledField?: string

    // Computed classes
    @meta.label 'Styled Field'
    @foorm.type 'text'
    @foorm.fn.classes '(v) => v ? "has-value" : "empty-value"'
    @foorm.order 10
    styledField?: string

    // Select with static options
    @meta.label 'Country'
    @meta.placeholder 'Select a country'
    @foorm.options 'United States', 'us'
    @foorm.options 'Canada', 'ca'
    @foorm.options 'United Kingdom', 'uk'
    @foorm.order 11
    country?: foorm.select

    // Radio with static options
    @meta.label 'Gender'
    @foorm.options 'Male', 'male'
    @foorm.options 'Female', 'female'
    @foorm.options 'Other', 'other'
    @foorm.order 12
    gender?: foorm.radio

    // Checkbox (single boolean)
    @meta.label 'I agree to terms and conditions'
    @foorm.order 13
    agreeToTerms: foorm.checkbox

    // Select with context-driven options
    @meta.label 'City'
    @meta.placeholder 'Select a city'
    @foorm.fn.options '(v, data, context) => context.cityOptions || []'
    @foorm.order 14
    city?: foorm.select

    // Action primitive with altAction
    @meta.label 'Reset Password'
    @foorm.altAction 'reset-password'
    @foorm.order 15
    resetAction: foorm.action

    // Static custom attrs
    @meta.label 'Username'
    @meta.placeholder 'Enter username'
    @foorm.type 'text'
    @foorm.attr 'data-testid', 'username-input'
    @foorm.attr 'aria-label', 'Username field'
    @foorm.attr 'maxlength', '50'
    @foorm.order 16
    username?: string

    // Computed custom attrs
    @meta.label 'Phone Number'
    @meta.placeholder '+1 (555) 123-4567'
    @foorm.type 'text'
    @foorm.fn.attr 'data-valid', '(v) => v && v.length >= 10 ? "true" : "false"'
    @foorm.fn.attr 'aria-invalid', '(v) => !v || v.length < 10 ? "true" : "false"'
    @foorm.order 17
    phone?: string

    // Mixed attrs (fn.attr overrides static)
    @meta.label 'Membership Level'
    @foorm.type 'text'
    @foorm.attr 'data-tier', 'basic'
    @foorm.fn.attr 'data-tier', '(v, data) => data.agreeToTerms ? "premium" : "basic"'
    @foorm.attr 'data-static', 'always-present'
    @foorm.order 18
    @foorm.readonly
    @foorm.fn.value '(v, data) => data.agreeToTerms ? "premium" : "basic"'
    membershipLevel?: string

    // Context-driven label from deep nested object
    @foorm.fn.label '(v, data, ctx) => ctx.labels?.contextLabel || "Fallback Label"'
    @foorm.fn.description '(v, data, ctx) => ctx.descriptions?.contextDescription || "Fallback description"'
    @foorm.type 'text'
    @foorm.order 19
    contextDrivenField?: string

    // Custom component field
    @meta.label 'Favorite Star'
    @meta.description 'This field uses a custom component with star prefix'
    @meta.placeholder 'Enter your favorite star'
    @foorm.type 'text'
    @foorm.component 'CustomInput'
    @foorm.validate '(v) => !v || v.length >= 3 || "Must be at least 3 characters"'
    @foorm.order 20
    favoriteStar?: string

    // Computed paragraph with foorm.fn.value
    @meta.label 'Summary'
    @foorm.fn.value '(v, data) => data.firstName && data.lastName ? "Hello, " + data.firstName + " " + data.lastName + "! You are " + (data.age || "?") + " years old." : "Fill out your info above to see a summary."'
    @foorm.order 21
    summary: foorm.paragraph
}
