import { describe, it, expect } from 'vitest';
import type { InsertWorkout } from '@shared/schema-static';

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

// Local copy of generateMarkdown from home.tsx for unit testing
function generateMarkdown(data: InsertWorkout, isRpeDirty = false, isFeelDirty = false): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  let markdown = `---\n## ${formatDate(data.workoutDate)}\n\n`;

  if (data.goal) markdown += `G: ${data.goal}\n`;
  if (isRpeDirty) markdown += `R: ${data.rpe}\n`;
  if (isFeelDirty) markdown += `F: ${data.feel}\n`;

  if (data.choIntakePre) markdown += `Ci-Pre: ${data.choIntakePre}\n`;
  if (data.choIntake) markdown += `Ci: ${data.choIntake}\n`;
  if (data.choIntakePost) markdown += `Ci-Post: ${data.choIntakePost}\n`;
  if (data.normalizedPower) markdown += `NP: ${data.normalizedPower}\n`;
  if (data.tss) markdown += `TSS: ${data.tss}\n`;
  if (data.avgHeartRate) markdown += `Hr: ${data.avgHeartRate}\n`;
  if (data.trainerRoadRpe) markdown += `TR-RPE: ${data.trainerRoadRpe}\n`;
  if (data.hrv) markdown += `HRV: ${data.hrv}\n`;
  if (data.rMSSD) markdown += `rMSSD: ${data.rMSSD}\n`;
  if (data.rhr) markdown += `RHR: ${data.rhr}\n`;
  if (data.trainerRoadLgt && data.trainerRoadLgt !== 'G') markdown += `TR-LGT: ${data.trainerRoadLgt}\n`;

  markdown += '\n';

  if (data.whatWentWell) {
    markdown += 'WWW\n';
    markdown += formatBulletPoints(data.whatWentWell) + '\n\n';
  }
  if (data.whatCouldBeImproved) {
    markdown += 'WCBI\n';
    markdown += formatBulletPoints(data.whatCouldBeImproved) + '\n';
  }
  if (data.description) {
    markdown += '\nPlanned\n';
    markdown += data.description + '\n';
  }

  return markdown;
}

const baseWorkout: InsertWorkout = {
  workoutDate: '2026-03-24',
  goal: '',
  rpe: 1,
  feel: 'N',
};

describe('generateMarkdown — R/F conditional output', () => {
  it('omits R and F on initial load (both flags false)', () => {
    const md = generateMarkdown(baseWorkout);
    expect(md).not.toContain('R:');
    expect(md).not.toContain('F:');
  });

  it('omits R and F when only an unrelated field (date) is changed', () => {
    const md = generateMarkdown({ ...baseWorkout, workoutDate: '2026-03-01' }, false, false);
    expect(md).not.toContain('R:');
    expect(md).not.toContain('F:');
  });

  it('emits R when isRpeDirty is true, omits F when isFeelDirty is false', () => {
    const md = generateMarkdown({ ...baseWorkout, rpe: 7 }, true, false);
    expect(md).toContain('R: 7');
    expect(md).not.toContain('F:');
  });

  it('emits F when isFeelDirty is true, omits R when isRpeDirty is false', () => {
    const md = generateMarkdown({ ...baseWorkout, feel: 'G' }, false, true);
    expect(md).toContain('F: G');
    expect(md).not.toContain('R:');
  });

  it('emits both R and F when both flags are true', () => {
    const md = generateMarkdown({ ...baseWorkout, rpe: 8, feel: 'S' }, true, true);
    expect(md).toContain('R: 8');
    expect(md).toContain('F: S');
  });

  it('emits R: 1 (default value) when intentionally set (isRpeDirty=true)', () => {
    // RPE=1 is the default but a legitimate post-workout value (recovery spin)
    const md = generateMarkdown({ ...baseWorkout, rpe: 1 }, true, false);
    expect(md).toContain('R: 1');
  });

  it('emits F: N (default value) when intentionally set (isFeelDirty=true)', () => {
    // Feel=N is the default but a legitimate value (normal day)
    const md = generateMarkdown({ ...baseWorkout, feel: 'N' }, false, true);
    expect(md).toContain('F: N');
  });

  it('emits G based on value truthiness regardless of dirty flags', () => {
    const withGoal = generateMarkdown({ ...baseWorkout, goal: 'Zone 2 base' });
    expect(withGoal).toContain('G: Zone 2 base');

    const withoutGoal = generateMarkdown({ ...baseWorkout, goal: '' });
    expect(withoutGoal).not.toContain('G:');
  });
});
