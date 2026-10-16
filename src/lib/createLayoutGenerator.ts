import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';

import { generateLayout } from '@/lib/generateLayout';

// Bind layout options once; per-call options override them, except undefined fields, which keep the bound value
export const createLayoutGenerator =
  (layoutOptions: LayoutOptions = {}) =>
  (layoutConfigs?: LayoutConfig[], layoutOptionsOverride: LayoutOptions = {}) => {
    const definedLayoutOptionsOverride = Object.fromEntries(
      Object.entries(layoutOptionsOverride).filter(([, value]) => value !== undefined),
    );

    return generateLayout(layoutConfigs, { ...layoutOptions, ...definedLayoutOptionsOverride });
  };
