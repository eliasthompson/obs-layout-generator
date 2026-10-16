import { describe, expect, it } from 'vitest';

import type { LayoutOptions } from '@/constants/layoutOptions';

import { createLayoutGenerator } from '@/lib/createLayoutGenerator';
import { generateLayout } from '@/lib/generateLayout';

const barOptions: LayoutOptions = { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 };

describe('createLayoutGenerator', () => {
  it('binds layout options for every call', () => {
    const generate = createLayoutGenerator(barOptions);

    expect(generate([{ hasName: true }])).toEqual(generateLayout([{ hasName: true }], barOptions));
    expect(generate([{}, {}])).toEqual(generateLayout([{}, {}], barOptions));
  });

  it('lays out a default participant on a default canvas with no arguments', () => {
    expect(createLayoutGenerator()()).toEqual(generateLayout());
  });

  it('overrides bound layout options per call', () => {
    const generate = createLayoutGenerator(barOptions);

    expect(generate([{}], { canvasMarginBottom: 0 })).toEqual(
      generateLayout([{}], { ...barOptions, canvasMarginBottom: 0 }),
    );
    expect(generate([{}], { canvasGap: 0 })).toEqual(generateLayout([{}], { ...barOptions, canvasGap: 0 }));
  });

  it('keeps bound layout options for undefined override fields', () => {
    const generate = createLayoutGenerator(barOptions);

    expect(generate([{}], { canvasGap: undefined, canvasPadding: undefined })).toEqual(
      generateLayout([{}], barOptions),
    );
  });
});
