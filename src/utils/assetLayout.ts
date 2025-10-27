import type { Assets } from '@/types/assets';
import type { TypewriterAssetEntry } from './typewriter';

export const getVisibleAssetEntries = (
  entries: TypewriterAssetEntry[],
  activeIndex: number,
  showAll: boolean,
  totalSentences: number,
): TypewriterAssetEntry[] => {
  if (showAll) {
    return entries;
  }

  if (!entries.length) return entries;

  const safeIndex = Math.max(0, Math.min(activeIndex, totalSentences - 1));
  return entries.filter((entry) => entry.index === safeIndex);
};

export const calculateAssetOffset = (
  entries: TypewriterAssetEntry[],
  index: number,
  assets: Assets | undefined,
  direct: boolean | undefined,
): number => {
  if (!assets || !entries.length) return 0;

  const trailingAudio = entries.slice(index).filter((entry) => Boolean(assets[entry.name]?.audio)).length;
  const baseOffset = (index - (entries.length - 1) + trailingAudio) * -100;
  return direct ? baseOffset * -1 : baseOffset;
};
