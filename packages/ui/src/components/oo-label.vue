<template>
    <span class="oo-label"><slot /></span>
</template>
<style>
/* Label styles */
.oo-label {
    font-size: var(--oo-label-font-size);
    font-weight: var(--oo-label-font-size);
    margin-bottom: var(--oo-space-gap);
    display: block;
    color: var(--oo-c-text-2);
}

.oo-label.oo-required:after {
    content: var(--oo-required-content);
    padding-left: 2px;
    color: var(--oo-c-negative)
}
.oo-hide-required .oo-label.oo-required:after {
    content: ""!important;
}
</style>