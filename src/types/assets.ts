export interface Asset {
  image?: string;
  audio?: string;
}

export type Assets = Record<string, Asset>;
