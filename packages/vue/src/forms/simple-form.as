@meta.label 'Quick Note'
@meta.required
@foorm.submit.text 'Save'
export interface SimpleForm {
  title: string[]

  content: string

  @meta.label 'Complex Field'
  complex: [string, boolean, string] | Address | string[][]

  @meta.label 'Agree to terms'
  test?: string[]
}

@meta.label 'Address'
interface Address {
  street: string
  city: string
  country: string
}