import { ref } from 'vue'

const darkFromStorage = window.localStorage.getItem('foorm-ui-dark-mode')
export const dark = ref(darkFromStorage ? (darkFromStorage === 'true') : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches))

applyDarkMode()

export function switchDark() {
    dark.value = !dark.value
    window.localStorage.setItem('foorm-ui-dark-mode', String(dark.value))
    applyDarkMode()
}

function applyDarkMode() {
    if (dark.value) {
        document.body.classList.add('dark')
    } else {
        document.body.classList.remove('dark')
    }
}
