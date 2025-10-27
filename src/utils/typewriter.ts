export interface RawSentence {
  duration?: number;
  message: string;
  asset?: string | string[];
}

export type SentenceSource = string | RawSentence | RawSentence[];

export interface NormalizedSentence {
  duration?: number;
  message: string;
  asset?: string[];
}

export interface TypewriterAssetEntry {
  name: string;
  index: number;
  key: string;
}

export const defaultDuration = 100;

export const normalizeSentenceData = (data?: SentenceSource): NormalizedSentence[] => {
  if (!data) return [];

  const normalize = (sentence: string | RawSentence): NormalizedSentence => {
    if (typeof sentence === 'string') {
      return {
        message: sentence,
        duration: defaultDuration,
        asset: undefined,
      };
    }

    const assets = sentence.asset ? (Array.isArray(sentence.asset) ? sentence.asset : [sentence.asset]) : undefined;

    return {
      message: sentence.message,
      duration: sentence.duration ?? defaultDuration,
      asset: assets,
    };
  };

  if (Array.isArray(data)) {
    return data.map((entry) => normalize(entry));
  }

  return [normalize(data)];
};

export const composeDisplayText = (
  sentences: NormalizedSentence[],
  activeIndex: number,
  cursor: number,
  showAll: boolean,
): string => {
  if (!sentences.length) return '';
  const safeCursor = Number.isFinite(cursor) ? cursor : Number.POSITIVE_INFINITY;

  return sentences.reduce((acc, sentence, index) => {
    if (index < activeIndex) {
      return acc + sentence.message;
    }

    if (index === activeIndex) {
      if (showAll) return acc + sentence.message;
      const sliceEnd = Math.min(safeCursor, sentence.message.length);
      return acc + sentence.message.slice(0, sliceEnd);
    }

    if (showAll) {
      return acc + sentence.message;
    }

    return acc;
  }, '');
};

export const buildAssetEntries = (sentences: NormalizedSentence[]): TypewriterAssetEntry[] => {
  return sentences.flatMap((sentence, index) => {
    if (!sentence.asset?.length) return [];

    return sentence.asset.map((name, assetIndex) => ({
      name,
      index,
      key: `${index}-${assetIndex}-${name}`,
    }));
  });
};
