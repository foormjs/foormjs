@foorm.fn.title '(data) => "User " + (data.firstName || "<unknown>")'
@foorm.submit.text 'Register'
@foorm.fn.submit.disabled '(data) => !data.firstName || !data.lastName'
export interface E2eTestForm {
    // Paragraph primitive
    @meta.label 'Welcome'
    @meta.description 'Please fill out this form'
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

    // Number field: default value, multiple validators
    @meta.label 'Age'
    @foorm.type 'number'
    @foorm.value '25'
    @foorm.validate '(v) => !!v || "Age is required"'
    @foorm.validate '(v) => (Number(v) >= 18) || "Must be 18 or older"'
    @foorm.order 3
    age: number

    // Text field: computed label, computed description
    @foorm.fn.label '(v, data) => data.firstName ? data.firstName + "s Email" : "Email"'
    @foorm.fn.description '(v, data) => data.firstName ? "We will contact " + data.firstName + " here" : "Your email address"'
    @foorm.type 'text'
    @foorm.autocomplete 'email'
    @foorm.order 4
    email?: string

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

    // Action primitive with altAction
    @meta.label 'Reset Password'
    @foorm.altAction 'reset-password'
    @foorm.order 11
    resetAction: foorm.action
}
