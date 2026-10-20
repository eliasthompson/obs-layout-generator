import type { LayoutConfig } from '@/constants/layoutConfig';

/** The region keys of a layout config, whose values are region configs that merge field by field. */
const layoutRegionKeys = [
  'camera',
  'contentMain',
  'contentAux',
  'info',
] as const satisfies readonly (keyof LayoutConfig)[];

/**
 * Merge a layout config over another: a region set on both merges field by field, so an override can change one
 * field of a region without restating the rest; `null` on either side turns the region off; a field left out of
 * the override keeps the base's value, and an `undefined` field in the override is treated as left out.
 *
 * @param base - The config to start from.
 * @param override - The config whose values win.
 * @returns A new config with the override applied; neither argument is changed.
 */
export const mergeLayoutConfigs = (base: LayoutConfig, override: LayoutConfig): LayoutConfig => {
  // Spread copies undefined fields too, so drop them first to keep "undefined means left out" for overrides
  const definedOverride = Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined),
  ) as LayoutConfig;
  const merged: LayoutConfig = { ...base, ...definedOverride };

  for (const key of layoutRegionKeys) {
    const baseRegion = base[key];
    const overrideRegion = definedOverride[key];

    // Only two region configs merge; a null or a missing side leaves the spread's answer standing. The merged region
    // has the fields of both, which the region's own type describes
    if (baseRegion && overrideRegion) merged[key] = { ...baseRegion, ...overrideRegion } as never;
  }

  return merged;
};
