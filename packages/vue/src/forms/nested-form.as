@foorm.title 'Company Profile'
@foorm.submit.text 'Save Profile'
export interface NestedForm {
    @meta.label 'Company Name'
    @meta.placeholder 'Acme Corp'
    @foorm.type 'text'
    @foorm.validate '(v) => !!v || "Company name is required"'
    @foorm.order 1
    companyName: string

    @foorm.order 2
    address: {
        @meta.label 'Street'
        @meta.placeholder '123 Main St'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "Street is required"'
        @foorm.order 3
        street: string

        @meta.label 'City'
        @meta.placeholder 'New York'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "City is required"'
        @foorm.order 4
        city: string

        @meta.label 'ZIP Code'
        @meta.placeholder '10001'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "ZIP code is required"'
        @foorm.order 5
        zip: string

        @foorm.order 6
        country: {
            @meta.label 'Country Name'
            @meta.placeholder 'United States'
            @foorm.type 'text'
            @foorm.validate '(v) => !!v || "Country name is required"'
            @foorm.order 7
            name: string

            @meta.label 'Country Code'
            @meta.placeholder 'US'
            @foorm.type 'text'
            @foorm.fn.hint '(v) => v && v.length !== 2 ? "Use a 2-letter ISO code" : ""'
            @foorm.validate '(v) => !!v || "Country code is required"'
            @foorm.order 8
            code: string
        }
    }

    @foorm.order 10
    contact: {
        @meta.label 'Contact First Name'
        @meta.placeholder 'Jane'
        @foorm.type 'text'
        @foorm.validate '(v) => !!v || "First name is required"'
        @foorm.order 11
        firstName: string

        @meta.label 'Contact Last Name'
        @meta.placeholder 'Doe'
        @foorm.type 'text'
        @foorm.order 12
        lastName?: string

        @meta.label 'Contact Email'
        @meta.placeholder 'jane@acme.com'
        @foorm.type 'text'
        @foorm.autocomplete 'email'
        @foorm.fn.description '(v, data) => data.contact?.firstName ? "Email for " + data.contact.firstName : "Contact email address"'
        @foorm.order 13
        email?: string.email

        @foorm.order 14
        department: {
            @meta.label 'Department Name'
            @meta.placeholder 'Engineering'
            @foorm.type 'text'
            @foorm.order 15
            name?: string

            @meta.label 'Floor'
            @foorm.type 'number'
            @foorm.order 16
            @expect.min 1, 'Floor must be at least 1'
            @expect.max 100, 'Floor must be at most 100'
            floor?: number

            @meta.label 'Room'
            @meta.placeholder 'A-101'
            @foorm.type 'text'
            @foorm.fn.hidden '(v, data) => !data.contact?.department?.floor'
            @foorm.order 17
            room?: string
        }
    }
}
