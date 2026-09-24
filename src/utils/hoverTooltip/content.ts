function clean(value: string | null | undefined): string | null {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  return text || null;
}

function textFromLabelledBy(element: HTMLElement): string | null {
  const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  if (ids.length === 0) return null;

  const documentRef = element.ownerDocument;
  const parts = ids
    .map((id) => documentRef.getElementById(id)?.textContent ?? '')
    .map((value) => clean(value))
    .filter((value): value is string => value !== null);
  return parts.length > 0 ? parts.join(' ') : null;
}

function textFromLeaves(element: Element): string | null {
  const parts: string[] = [];

  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        const text = clean(child.textContent);
        if (text) parts.push(text);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    }
  };

  walk(element);
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Returns a plain-text label for a managed hover trigger. The native Spotify
 * tooltip may expose its label through any of these attributes, so the
 * HoverTooltip must not remove a trigger until the replacement has equivalent
 * text to show.
 */
export function getHoverTooltipContent(trigger: HTMLElement): string | null {
  const ariaLabel = clean(trigger.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const labelledBy = textFromLabelledBy(trigger);
  if (labelledBy) return labelledBy;

  const ariaDescription = clean(trigger.getAttribute('aria-description'));
  if (ariaDescription) return ariaDescription;

  const title = clean(trigger.getAttribute('title'));
  if (title) return title;

  const dataTooltip = clean(trigger.getAttribute('data-tooltip-content'));
  if (dataTooltip) return dataTooltip;

  const placeholder = clean(trigger.getAttribute('placeholder'));
  if (placeholder) return placeholder;

  if (trigger.tagName === 'IMG') {
    const alt = clean(trigger.getAttribute('alt'));
    if (alt) return alt;
  }

  if (trigger.tagName === 'BUTTON') return clean(trigger.textContent);

  const anchorText: string[] = [];
  for (const child of Array.from(trigger.children)) {
    if (child.tagName !== 'A') continue;
    const anchor = child as HTMLElement;
    const text =
      clean(anchor.getAttribute('aria-label')) ??
      textFromLabelledBy(anchor) ??
      clean(anchor.getAttribute('title')) ??
      clean(anchor.textContent);
    if (text) anchorText.push(text);
  }
  if (anchorText.length > 0) return anchorText.join(', ');

  return textFromLeaves(trigger);
}
