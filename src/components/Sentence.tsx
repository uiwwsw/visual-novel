import { AnimatePresence, motion } from 'framer-motion';
import { MouseEvent, useMemo, useState } from 'react';
import type { Assets } from '@/types/assets';
import { calculateAssetOffset, getVisibleAssetEntries } from '#/assetLayout';
import { useTypewriter } from '#/useTypewriter';
import type { RawSentence } from '#/typewriter';

export interface SentenceProps {
  assets?: Assets;
  data?: string | RawSentence | RawSentence[];
  direct?: boolean;
  isComplete: boolean;
  onComplete: () => void;
}

const speedPresets = [
  { id: 'slow', label: '느림', multiplier: 1.5 },
  { id: 'normal', label: '보통', multiplier: 1 },
  { id: 'fast', label: '빠름', multiplier: 0.6 },
] as const;

type SpeedPresetId = (typeof speedPresets)[number]['id'];

const SentenceAssets = ({
  assets,
  direct,
  entries,
}: {
  assets?: Assets;
  direct?: boolean;
  entries: ReturnType<typeof getVisibleAssetEntries>;
}) => {
  if (!assets || entries.length === 0) return null;

  return (
    <>
      {entries.map(({ name, key }) => {
        const asset = assets[name];
        if (!asset?.audio) return null;
        return <audio key={`audio-${key}`} src={asset.audio} autoPlay />;
      })}
      <AnimatePresence initial={false}>
        {entries.map(({ name, key }, index, arr) => {
          const asset = assets[name];
          if (!asset?.image) return null;
          const offset = calculateAssetOffset(arr, index, assets, direct);
          const initialOffset = direct ? offset + 24 : offset - 24;

          return (
            <motion.img
              key={`image-${key}`}
              className={`pointer-events-none fixed top-1/2 -translate-y-1/2 transform object-contain drop-shadow-lg ${
                direct ? 'right-[12%]' : 'left-[12%]'
              } max-h-40 w-auto max-w-[45vw] sm:max-h-56 sm:max-w-[35vw] md:max-h-64`}
              src={asset.image}
              alt=""
              initial={{ opacity: 0, scale: 0.9, x: initialOffset }}
              animate={{ opacity: 1, scale: 1, x: offset }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{
                opacity: { duration: 0.25, ease: 'easeOut' },
                scale: { duration: 0.3, ease: 'easeOut' },
                x: { type: 'spring', stiffness: 240, damping: 26 },
              }}
            />
          );
        })}
      </AnimatePresence>
    </>
  );
};

const Sentence = ({ assets, data, direct, isComplete: isCompleteProp, onComplete }: SentenceProps) => {
  const [speed, setSpeed] = useState<SpeedPresetId>('normal');
  const speedMultiplier = useMemo(
    () => speedPresets.find((preset) => preset.id === speed)?.multiplier ?? 1,
    [speed],
  );

  const {
    activeIndex,
    assets: assetEntries,
    displayText,
    internalComplete,
    intervalDuration,
    isTyping,
    sentenceCount,
    skip,
  } = useTypewriter({
    data,
    isExternallyComplete: isCompleteProp,
    onComplete,
    speedMultiplier,
  });

  const showAll = isCompleteProp || internalComplete;
  const visibleAssets = useMemo(
    () => getVisibleAssetEntries(assetEntries, activeIndex, showAll, sentenceCount),
    [assetEntries, activeIndex, showAll, sentenceCount],
  );
  const handleSkip = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (showAll) return;
    skip();
  };

  const handleSpeedChange = (event: MouseEvent<HTMLButtonElement>, preset: SpeedPresetId) => {
    event.stopPropagation();
    setSpeed(preset);
  };

  return (
    <div className="relative flex flex-1 flex-col gap-1">
      <SentenceAssets assets={assets} direct={direct} entries={visibleAssets} />
      <p className="relative flex-1 whitespace-pre-line text-sm leading-relaxed sm:text-base">
        {displayText}
        {showAll ? (
          <span className="ml-2 inline-block w-fit animate-pulse align-middle text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>
          </span>
        ) : isTyping ? (
          <span className="ml-1 inline-block animate-pulse align-baseline" style={{ animationDuration: `${intervalDuration}ms` }}>
            |
          </span>
        ) : null}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-black/70 sm:text-xs">
        <div className="flex items-center gap-1">
          <span className="font-semibold">타이핑 속도</span>
          {speedPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`rounded px-2 py-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                preset.id === speed
                  ? 'bg-black/80 text-white focus-visible:ring-black'
                  : 'bg-black/10 hover:bg-black/20 focus-visible:ring-black/40'
              }`}
              onClick={(event) => handleSpeedChange(event, preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSkip}
          disabled={showAll}
          className="rounded border border-black/20 px-2 py-0.5 font-medium text-black transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전체 보기
        </button>
      </div>
    </div>
  );
};

export default Sentence;
