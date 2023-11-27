<script setup lang="ts">
import { nextTick, ref, watch, computed, onMounted } from 'vue'

type Props = { error?: string, hint?: string, disabled?: boolean }
const props = defineProps<Props>()
const bottomSpan = ref<HTMLSpanElement>()

const overflow = ref(false)
const text = computed(() => props.disabled ? props.hint : props.error || props.hint)

watch(text, () => {
    nextTick(checkOverflow)
})

onMounted(checkOverflow)

function checkOverflow() {
    if (bottomSpan.value) {
        overflow.value = (bottomSpan.value.scrollWidth - bottomSpan.value.clientWidth) > 0
    }
}

</script>

<template>
    <div class="oo-bottom-slot" :class="{ 'show': !!text, 'oo-text-negative': !!error }">
        <span ref="bottomSpan">{{ text }}</span>
        <!-- <div class="oo-tooltip oo-bordered oo-text-p oo-text-white-1"
        :class="{ 'oo-bg-hegative': !!error, 'oo-bg-neutral': !error }"
        v-if="!disabled && !!text && overflow"
        >
            {{ text }}
        </div> -->
    </div>
</template>

<style>
.oo-bottom-slot {
    color: var(--oo-c-text-2);
    position: relative;
    font-weight: normal;
    height: 0;
    opacity: 0;
    margin-top: var(--oo-space-gap);
    font-size: 14px;
    line-height: 18px;
    transition: height var(--oo-transition), opacity var(--oo-transition);
}
.oo-bottom-slot.show {
    opacity: 1;
    height: auto;
}
.oo-bottom-slot > span {
    /* display: block; */
    /* position: absolute; */
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    opacity: 0.75;
    overflow: hidden;
    /* white-space: nowrap; */
    /* text-overflow: ellipsis; */
}
/* .oo-tooltip {
    pointer-events: none;
    position: absolute;
    z-index: 1;
    left: 0;
    top: 2px;
    right: 0;
    opacity: 0;
    transition: opacity var(--oo-transition);
    line-height: 16px;
}
.oo-form-entry:hover .oo-tooltip, .oo-form-entry.focused .oo-tooltip {
    opacity: 1;
} */
</style>