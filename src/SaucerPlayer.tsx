import { createPlayer } from '@videojs/react';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { Video, videoFeatures } from '@videojs/react/video';
import type { CSSProperties } from 'react';

import { SaucerSkin, type AppleTheme, type DishTheme } from './skin/SaucerSkin';

const { Player } = createPlayer({ features: videoFeatures });

export interface SaucerPlayerProps {
  /** Mux playback ID of a public asset. Streams adaptively over HLS; Mux supplies the poster. */
  playbackId?: string;
  /** Any other video URL. Wins over `playbackId`. */
  src?: string;
  poster?: string;
  dish?: DishTheme;
  apple?: AppleTheme;
  style?: CSSProperties;
}

/** A Video.js v10 player wearing the Silver Saucer skin. */
export function SaucerPlayer({ playbackId, src, poster, dish, apple, style }: SaucerPlayerProps) {
  return (
    <Player poster={poster}>
      <SaucerSkin dish={dish} apple={apple} style={style}>
        {src || !playbackId ? (
          <Video src={src} playsInline preload="metadata" />
        ) : (
          <MuxVideo source={{ playbackId }} playsInline preload="metadata" />
        )}
      </SaucerSkin>
    </Player>
  );
}
