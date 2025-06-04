export function GetElementHeight(element: Element) {
  // Get the computed styles for the ::before pseudo-element
  const beforeStyles = getComputedStyle(element, '::before');
  const afterStyles = getComputedStyle(element, '::after');

  // @ts-ignore
  return (element.offsetHeight + beforeStyles.height + afterStyles.height)
}