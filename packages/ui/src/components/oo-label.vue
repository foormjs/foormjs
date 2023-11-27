<template>
    <span class="oo-label"><slot /></span>
</template>
<style>
/* Label styles */
.oo-label {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: var(--oo-space-gap);
    display: block;
    color: var(--oo-c-text-2);
    opacity: 0.75;
}

.focused .oo-label {
    opacity: 1;
}

.oo-label.oo-required:after {
    content: "*";
    padding-left: 2px;
    color: var(--oo-c-negative)
}
.oo-hide-required .oo-label.oo-required:after {
    content: ""!important;
}
</style>