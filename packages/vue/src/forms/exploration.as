// Exploration: where do type-level annotations end up
// when a type is referenced as an array element?

@foorm.component 'CustomInput'
@foorm.title 'Address'
interface TAddress {
    @meta.label 'Street'
    @foorm.type 'text'
    street: string

    @meta.label 'City'
    @foorm.type 'text'
    city: string
}

@foorm.title 'Exploration'
export interface ExplorationForm {
    @meta.label 'Name'
    @foorm.type 'text'
    name: string

    // Case 1: array of annotated type reference
    @meta.label 'Addresses'
    addresses: TAddress[]

    // Case 2: inline object (no type-level annotations)
    @meta.label 'Contacts'
    contacts: {
        @meta.label 'Phone'
        @foorm.type 'text'
        phone: string
    }[]
}
