import { describe, it, expect } from 'vitest';
import type { InsertWorkout } from '@shared/schema-static';

// Local copies of helpers from home.tsx for unit testing
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

// Local copies of generateMarkdown helpers from home.tsx for unit testing
function formatWorkoutDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function generateCyclingMarkdown(data: InsertWorkout): string {
  let markdown = "";

  if (data.goal) markdown += `G: ${data.goal}\n`;
  markdown += `R: ${data.rpe}\n`;
  markdown += `F: ${data.feel}\n`;

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
  if (data.trainerRoadLgt && data.trainerRoadLgt !== 'G') {
    markdown += `TR-LGT: ${data.trainerRoadLgt}\n`;
  }

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

function generateRestMarkdown(data: InsertWorkout): string {
  let markdown = "Rest Day\n\n";

  if (data.hrv) markdown += `HRV: ${data.hrv}\n`;
  if (data.rMSSD) markdown += `rMSSD: ${data.rMSSD}\n`;
  if (data.rhr) markdown += `RHR: ${data.rhr}\n`;
  if (data.trainerRoadLgt && data.trainerRoadLgt !== 'G') {
    markdown += `TR-LGT: ${data.trainerRoadLgt}\n`;
  }
  if (data.weight) markdown += `Weight: ${data.weight}\n`;

  if (data.restNotes) {
    markdown += '\n' + formatBulletPoints(data.restNotes) + '\n';
  }

  return markdown;
}

function generateOtherMarkdown(data: InsertWorkout): string {
  let markdown = "";

  if (data.activityGoal) markdown += `G: ${data.activityGoal}\n`;

  if (data.activityNotes) {
    markdown += '\n' + formatBulletPoints(data.activityNotes) + '\n';
  }

  return markdown;
}

function generateMarkdown(data: InsertWorkout): string {
  let markdown = `---\n## ${formatWorkoutDate(data.workoutDate)}\n\n`;

  switch (data.entryType) {
    case "rest":
      markdown += generateRestMarkdown(data);
      break;
    case "other":
      markdown += generateOtherMarkdown(data);
      break;
    case "cycling":
    default:
      markdown += generateCyclingMarkdown(data);
      break;
  }

  return markdown;
}

const baseCyclingWorkout: InsertWorkout = {
  entryType: 'cycling',
  workoutDate: '2026-03-24',
  goal: '',
  rpe: 1,
  feel: 'N',
};

describe('generateMarkdown — cycling R/F output', () => {
  it('always includes R and F', () => {
    const md = generateMarkdown(baseCyclingWorkout);
    expect(md).toContain('R: 1');
    expect(md).toContain('F: N');
  });

  it('reflects rpe and feel values', () => {
    const md = generateMarkdown({ ...baseCyclingWorkout, rpe: 8, feel: 'S' });
    expect(md).toContain('R: 8');
    expect(md).toContain('F: S');
  });

  it('includes G when goal is set, omits it when empty', () => {
    expect(generateMarkdown({ ...baseCyclingWorkout, goal: 'Zone 2 base' })).toContain('G: Zone 2 base');
    expect(generateMarkdown({ ...baseCyclingWorkout, goal: '' })).not.toContain('G:');
  });

  it('starts with date header', () => {
    const md = generateMarkdown(baseCyclingWorkout);
    expect(md).toMatch(/^---\n## \d{2}\.\d{2}\.2026\n\n/);
  });
});

describe('generateMarkdown — rest output', () => {
  const baseRest: InsertWorkout = {
    entryType: 'rest',
    workoutDate: '2026-04-13',
  };

  it('emits the Rest Day marker immediately after the date header', () => {
    const md = generateMarkdown(baseRest);
    expect(md).toMatch(/^---\n## \d{2}\.\d{2}\.2026\n\nRest Day\n\n$/);
  });

  it('includes recovery metrics and weight when provided', () => {
    const md = generateMarkdown({
      ...baseRest,
      hrv: '7. Limit intensity today.',
      rMSSD: 30,
      rhr: 63,
      trainerRoadLgt: 'Y',
      weight: 82.5,
    });
    expect(md).toContain('HRV: 7. Limit intensity today.');
    expect(md).toContain('rMSSD: 30');
    expect(md).toContain('RHR: 63');
    expect(md).toContain('TR-LGT: Y');
    expect(md).toContain('Weight: 82.5');
  });

  it('omits TR-LGT when Green (default)', () => {
    const md = generateMarkdown({ ...baseRest, trainerRoadLgt: 'G' });
    expect(md).not.toContain('TR-LGT');
  });

  it('formats rest notes as bullet points', () => {
    const md = generateMarkdown({
      ...baseRest,
      restNotes: 'Yesterday was stressful\nDecided to skip training',
    });
    expect(md).toContain('- Yesterday was stressful');
    expect(md).toContain('- Decided to skip training');
  });

  it('excludes cycling-only fields', () => {
    const md = generateMarkdown({
      ...baseRest,
      goal: 'leaked goal',
      rpe: 7,
      feel: 'S',
      normalizedPower: 200,
      tss: 50,
      choIntake: 'gel',
      whatWentWell: 'x',
      whatCouldBeImproved: 'y',
    });
    expect(md).not.toContain('G:');
    expect(md).not.toContain('R:');
    expect(md).not.toContain('F:');
    expect(md).not.toContain('NP:');
    expect(md).not.toContain('TSS:');
    expect(md).not.toContain('Ci:');
    expect(md).not.toContain('WWW');
    expect(md).not.toContain('WCBI');
  });

  it('omits empty optional fields', () => {
    const md = generateMarkdown(baseRest);
    expect(md).not.toContain('HRV:');
    expect(md).not.toContain('rMSSD:');
    expect(md).not.toContain('RHR:');
    expect(md).not.toContain('Weight:');
  });
});

describe('generateMarkdown — other output', () => {
  const baseOther: InsertWorkout = {
    entryType: 'other',
    workoutDate: '2026-04-13',
  };

  it('includes G when activityGoal is set', () => {
    const md = generateMarkdown({ ...baseOther, activityGoal: 'MFR' });
    expect(md).toContain('G: MFR');
  });

  it('omits G when activityGoal is empty', () => {
    const md = generateMarkdown({ ...baseOther, activityGoal: '' });
    expect(md).not.toContain('G:');
  });

  it('formats activity notes as bullet points', () => {
    const md = generateMarkdown({
      ...baseOther,
      activityGoal: 'MFR',
      activityNotes: 'Full body protocol v3\nCalves and quads were tender',
    });
    expect(md).toContain('- Full body protocol v3');
    expect(md).toContain('- Calves and quads were tender');
  });

  it('excludes all metrics and cycling fields', () => {
    const md = generateMarkdown({
      ...baseOther,
      activityGoal: 'Yoga',
      goal: 'leaked',
      rpe: 5,
      feel: 'N',
      hrv: 'leaked',
      rMSSD: 40,
      rhr: 60,
      weight: 80,
      normalizedPower: 200,
      tss: 50,
    });
    expect(md).not.toContain('R:');
    expect(md).not.toContain('F:');
    expect(md).not.toContain('HRV:');
    expect(md).not.toContain('rMSSD:');
    expect(md).not.toContain('RHR:');
    expect(md).not.toContain('Weight:');
    expect(md).not.toContain('NP:');
    expect(md).not.toContain('TSS:');
  });
});
