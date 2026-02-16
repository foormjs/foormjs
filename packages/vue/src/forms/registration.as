@foorm.fn.title '(data) => "User " + (data.firstName || "<unknown>")'
@foorm.submit.text 'Submit'
@foorm.fn.submit.disabled '(data) => data.firstName?.toLowerCase() === "artem"'
export interface RegistrationForm {
    @meta.label 'Info'
    @meta.description 'Enter your name and age'
    info: foorm.paragraph

    @meta.label 'First Name'
    @meta.description 'Not a nickname'
    @meta.placeholder 'John'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "Required"'
    firstName: string

    @meta.label 'Last Name'
    @meta.placeholder 'Doe'
    @meta.hint 'Real last name please'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "Required"'
    lastName: string

    @meta.label 'Age'
    @foorm.type 'number'
    @foorm.validate '(v) => !!v || "Required"'
    age: number
}
