import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';

import { generateLayout } from '@/lib/generateLayout';

/**
 * Bind layout options once and get a function that lays out participants with them.
 *
 * @param layoutOptions - Canvas options applied to every call.
 * @returns A function taking layout configs and optional per-call options that override the bound ones. An
 *   `undefined` field in the per-call options keeps the bound value rather than resetting it to the default.
 */
export const createLayoutGenerator =
  (layoutOptions: LayoutOptions = {}) =>
  (layoutConfigs?: LayoutConfig[], layoutOptionsOverride: LayoutOptions = {}) => {
    // Spread copies undefined fields too, so drop them first to keep "undefined means not set" for overrides
    const definedLayoutOptionsOverride = Object.fromEntries(
      Object.entries(layoutOptionsOverride).filter(([, value]) => value !== undefined),
    );

    return generateLayout(layoutConfigs, { ...layoutOptions, ...definedLayoutOptionsOverride });
  };
