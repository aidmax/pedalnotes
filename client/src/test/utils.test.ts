import { describe, it, expect } from 'vitest';

// Test the formatBulletPoints function from home.tsx
function formatBulletPoints(text: string): string {
  if (!text) return "";

  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .flatMap((rawLine) => {
      if (!rawLine.trim()) return [];

      const hasExplicitListMarker = /^\s*[\u2022*+-]\s+/.test(rawLine);
      const leadingWhitespace = hasExplicitListMarker ? (rawLine.match(/^\s*/)?.[0] ?? "") : "";
      const trimmedLine = rawLine.trim();

      const segments = trimmedLine.includes("\u2022")
        ? trimmedLine.split(/\s*\u2022\s*/).map((segment) => segment.trim()).filter(Boolean)
        : [trimmedLine];

      return segments.map((segment) => {
        const markdownMarkerMatch = segment.match(/^[-*+]\s+(.*)$/);
        const content = markdownMarkerMatch ? markdownMarkerMatch[1] : segment;
        return `${leadingWhitespace}- ${content}`;
      });
    })
    .join("\n");
}

describe('formatBulletPoints', () => {
  it('should return empty string for empty input', () => {
    expect(formatBulletPoints('')).toBe('');
  });

  it('should add bullet points to single line', () => {
    expect(formatBulletPoints('Test line')).toBe('- Test line');
  });

  it('should add bullet points to multiple lines', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    const expected = '- Line 1\n- Line 2\n- Line 3';
    expect(formatBulletPoints(input)).toBe(expected);
  });

  it('should preserve existing bullet points', () => {
    const input = '• Already has bullet\nNo bullet here';
    const expected = '- Already has bullet\n- No bullet here';
    expect(formatBulletPoints(input)).toBe(expected);
  });

  it('should filter out empty lines', () => {
    const input = 'Line 1\n\n\nLine 2\n   \nLine 3';
    const expected = '- Line 1\n- Line 2\n- Line 3';
    expect(formatBulletPoints(input)).toBe(expected);
  });

  it('should trim whitespace from lines', () => {
    const input = '  Line 1  \n   Line 2   ';
    const expected = '- Line 1\n- Line 2';
    expect(formatBulletPoints(input)).toBe(expected);
  });

  it('should split inline unicode bullets into markdown list items', () => {
    const input = 'Setup all the equipment • Double checked calibration • Started warmup';
    const expected = '- Setup all the equipment\n- Double checked calibration\n- Started warmup';
    expect(formatBulletPoints(input)).toBe(expected);
  });

  it('should preserve nested bullets via indentation', () => {
    const input = 'Main point\n  • Child point\n    * Deeper child';
    const expected = '- Main point\n  - Child point\n    - Deeper child';
    expect(formatBulletPoints(input)).toBe(expected);
  });
});
