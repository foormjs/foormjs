import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useDropdown(containerRef: Ref<HTMLElement | null>) {
  const isOpen = ref(false)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  function select(callback: () => void) {
    callback()
    close()
  }

  function onClickOutside(event: MouseEvent) {
    if (isOpen.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
      close()
    }
  }

  onMounted(() => document.addEventListener('click', onClickOutside, true))
  onBeforeUnmount(() => document.removeEventListener('click', onClickOutside, true))

  return { isOpen, toggle, close, select }
}
