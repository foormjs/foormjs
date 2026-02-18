export type TFoormRule<TValue, TFormData, TContext> = (
  v: TValue,
  data?: TFormData,
  context?: TContext
) => boolean | string

export interface TFoormFieldCallbacks {
  validate: () => boolean | string
  clearErrors: () => void
  reset: () => void
  setExternalError: (msg?: string) => void
}

export interface TFoormFieldRegistration {
  path: () => string | undefined
  callbacks: TFoormFieldCallbacks
}

export interface TFoormState<TFormData, TContext> {
  firstSubmitHappened: boolean
  firstValidation: 'on-change' | 'touched-on-blur' | 'on-blur' | 'on-submit' | 'none'
  register: (id: symbol, registration: TFoormFieldRegistration) => void
  unregister: (id: symbol) => void
  formData: TFormData
  formContext?: TContext
}
