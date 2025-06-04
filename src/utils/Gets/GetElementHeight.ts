export function GetElementHeight(element: HTMLElement) {
  // Get the computed styles for the ::before pseudo-element
  const beforeStyles = getComputedStyle(element, '::before');
  const afterStyles = getComputedStyle(element, '::after');

  return (
    element.offsetHeight +
    parseFloat(beforeStyles.height) +
    parseFloat(afterStyles.height)
  );
}
