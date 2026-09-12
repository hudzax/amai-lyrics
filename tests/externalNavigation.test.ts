import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveTrustedExternalUrl,
  buildYouTubeSearchUrl,
  openTrustedExternalUrl,
  openYouTubeSearch,
} from '../src/utils/externalNavigation';

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll('a.amai-test-anchor').forEach((el) => el.remove());
});

describe('resolveTrustedExternalUrl', () => {
  it('allows https urls on trusted hosts', () => {
    expect(resolveTrustedExternalUrl('https://github.com/hudzax/amai-lyrics')).toBe(
      'https://github.com/hudzax/amai-lyrics',
    );
  });

  it('rejects non-https, untrusted, and malformed urls', () => {
    expect(resolveTrustedExternalUrl('http://github.com/hudzax/amai-lyrics')).toBeNull();
    expect(resolveTrustedExternalUrl('https://evil.example/x')).toBeNull();
    expect(resolveTrustedExternalUrl('not a url')).toBeNull();
  });
});

describe('buildYouTubeSearchUrl', () => {
  it('keeps the query inside the search param on the trusted host', () => {
    const url = buildYouTubeSearchUrl('artist song music video');
    expect(url).toBe('https://www.youtube.com/results?search_query=artist+song+music+video');
  });
});

describe('openTrustedExternalUrl', () => {
  it('refuses to navigate for untrusted urls', () => {
    const click = vi
      .spyOn(window.HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    expect(openTrustedExternalUrl('https://evil.example/x', '_blank')).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('follows trusted urls and cleans up the anchor', () => {
    const click = vi
      .spyOn(window.HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        this.classList.add('amai-test-anchor');
      });
    expect(openTrustedExternalUrl('https://github.com/hudzax/amai-lyrics', '_self')).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[href="https://github.com/hudzax/amai-lyrics"]')).toBeNull();
  });

  it('opens youtube searches in a new tab', () => {
    const click = vi
      .spyOn(window.HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    expect(openYouTubeSearch('artist song music video')).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
  });
});
