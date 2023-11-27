export function isElementFullyVisibleInContainer(element: HTMLElement, container: HTMLElement) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check vertical visibility
    const isVerticallyVisible =
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom

    return isVerticallyVisible
}
