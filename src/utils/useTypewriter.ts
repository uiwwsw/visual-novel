import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NormalizedSentence,
  SentenceSource,
  TypewriterAssetEntry,
  buildAssetEntries,
  composeDisplayText,
  defaultDuration,
  normalizeSentenceData,
} from './typewriter';

export interface UseTypewriterOptions {
  data?: SentenceSource;
  isExternallyComplete: boolean;
  onComplete?: () => void;
  speedMultiplier: number;
}

export interface UseTypewriterResult {
  activeIndex: number;
  assets: TypewriterAssetEntry[];
  currentSentence?: NormalizedSentence;
  displayText: string;
  internalComplete: boolean;
  intervalDuration: number;
  isTyping: boolean;
  sentenceCount: number;
  skip: () => void;
}

const MIN_INTERVAL = 16;

export const useTypewriter = ({
  data,
  isExternallyComplete,
  onComplete,
  speedMultiplier,
}: UseTypewriterOptions): UseTypewriterResult => {
  const sentences = useMemo(() => normalizeSentenceData(data), [data]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const assets = useMemo(() => buildAssetEntries(sentences), [sentences]);
  const currentSentence = activeIndex < sentences.length ? sentences[activeIndex] : undefined;
  const onCompleteRef = useRef(onComplete);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSentences = sentences.length > 0;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setActiveIndex(0);
    setCursor(0);
  }, [sentences]);

  const intervalDuration = useMemo(() => {
    const baseDuration = currentSentence?.duration ?? defaultDuration;
    return Math.max(MIN_INTERVAL, Math.round(baseDuration * speedMultiplier));
  }, [currentSentence?.duration, speedMultiplier]);

  const showAll = isExternallyComplete || activeIndex >= sentences.length;

  const displayText = useMemo(
    () => composeDisplayText(sentences, activeIndex, cursor, showAll),
    [sentences, activeIndex, cursor, showAll],
  );

  const internalComplete = useMemo(() => activeIndex >= sentences.length, [activeIndex, sentences.length]);

  const clearTimer = () => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (!currentSentence || showAll) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      setCursor((prev) => {
        const next = prev + 1;
        if (next >= currentSentence.message.length) {
          clearTimer();
          return next;
        }
        return next;
      });
    }, intervalDuration);

    return clearTimer;
  }, [currentSentence?.message, intervalDuration, showAll]);

  useEffect(() => {
    if (!currentSentence) return;
    if (cursor < currentSentence.message.length) return;

    setActiveIndex((prev) => prev + 1);
    setCursor(0);
  }, [cursor, currentSentence?.message, currentSentence]);

  useEffect(() => {
    if (!internalComplete || !hasSentences) return;
    onCompleteRef.current?.();
  }, [internalComplete, hasSentences]);

  useEffect(() => {
    if (!isExternallyComplete) return;
    clearTimer();
    setActiveIndex(sentences.length);
  }, [isExternallyComplete, sentences.length]);

  const skip = () => {
    clearTimer();
    setActiveIndex(sentences.length);
  };

  return {
    activeIndex,
    assets,
    currentSentence,
    displayText,
    internalComplete,
    intervalDuration,
    isTyping: Boolean(currentSentence) && !showAll,
    sentenceCount: sentences.length,
    skip,
  };
};
