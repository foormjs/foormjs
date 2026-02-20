@meta.label 'Playground Form'
@meta.required
@foorm.submit.text 'Go'
export interface PlaygroundForm {
  
  @meta.label 'Addresses /Contacts'
  addresses: (Address | Contact | MyString)[]


}

@meta.label 'Address'
interface Address {
  @foorm.hidden
  type: 'address'
  street: string
  city: string
  country: string
}

@meta.label 'Contact'
interface Contact {
  @foorm.hidden
  type: 'phone'
  email: string
  phone: string
}

@meta.label 'Add addresses, contacts, or just text'
type MyString = string