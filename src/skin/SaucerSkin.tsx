import {
  BufferingIndicator,
  Container,
  ErrorDialog,
  Gesture,
  Hotkey,
  Poster,
  SeekIndicator,
  StatusAnnouncer,
  VolumeIndicator,
} from '@videojs/react';
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { SaucerControls } from './Controls';
import { computeLayout } from './layout';
import { Rim } from './Rim';
import { useTilt } from './useTilt';

import './saucer-skin.css';

export type DishTheme = 'khokhloma' | 'gzhel' | 'silver';
export type AppleTheme = 'red' | 'golden' | 'green';

/** How square each dish's shoulders are. 2 is a true oval. */
const DISH_SHAPE: Record<DishTheme, number> = { khokhloma: 2.6, gzhel: 2.3, silver: 2 };

export interface SaucerSkinProps {
  /** The media element, such as `<Video>`. */
  children: ReactNode;
  /** The painted dish. */
  dish?: DishTheme;
  /** The apple that rolls around its rim. */
  apple?: AppleTheme;
  className?: string;
  style?: CSSProperties;
}

/**
 * Silver Saucer: a Video.js v10 skin after the folk tale of the silver saucer and the ripe apple,
 * in which an apple rolled around a saucer shows faraway places in it. The video plays in the well
 * of a painted dish and the apple rolling around the rim is the seek bar.
 */
export function SaucerSkin({ children, dish = 'khokhloma', apple = 'red', className, style }: SaucerSkinProps) {
  const sizer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [bar, setBar] = useState<{ width: number; height: number } | undefined>(undefined);
  const tilt = useTilt();

  useLayoutEffect(() => {
    const element = sizer.current;
    if (!element) return;
    const measure = () => {
      const width = Math.round(element.clientWidth);
      const height = Math.round(element.clientHeight);
      if (width > 0 && height > 0) {
        setSize((previous) => (previous?.width === width && previous.height === height ? previous : { width, height }));
      }
    };
    // The control bar changes width as it sheds controls, so the dish seats it by its real size.
    const barElement = element.parentElement?.querySelector<HTMLElement>('.saucer-bar');
    const measureBar = () => {
      if (!barElement) return;
      const width = Math.round(barElement.offsetWidth);
      const height = Math.round(barElement.offsetHeight);
      if (width > 0 && height > 0) {
        setBar((previous) => (previous?.width === width && previous.height === height ? previous : { width, height }));
      }
    };
    measure();
    measureBar();
    const observer = new ResizeObserver(() => {
      measure();
      measureBar();
    });
    observer.observe(element);
    if (barElement) observer.observe(barElement);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => (size ? computeLayout(size.width, size.height, DISH_SHAPE[dish], bar) : null),
    [size, dish, bar]
  );

  const vars = layout
    ? ({
        '--saucer-rim': `${layout.rim}px`,
        '--saucer-chord': `${Math.floor(layout.chord)}px`,
        '--saucer-bar-bottom': `${layout.barBottom.toFixed(1)}px`,
        '--saucer-center-y': `${layout.centerY.toFixed(1)}px`,
        '--saucer-center-max': `${layout.centerMax.toFixed(1)}px`,
        '--saucer-well': `path("${layout.inner.d}")`,
        '--saucer-outline': `path("${layout.outer.d}")`,
      } as CSSProperties)
    : undefined;

  return (
    <Container
      className={['saucer-skin', className].filter(Boolean).join(' ')}
      data-dish={dish}
      data-apple={apple}
      style={{ ...vars, ...style }}
    >
      <div ref={sizer} className="saucer-sizer" aria-hidden="true" />
      <div className="saucer-shadow" aria-hidden="true">
        <i />
      </div>

      <div className="saucer-well">
        {children}
        <Poster.Root className="saucer-poster">
          <Poster.Image className="saucer-poster-image" />
        </Poster.Root>
      </div>

      <BufferingIndicator className="saucer-buffering">
        <span className="saucer-buffering-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </BufferingIndicator>

      <div className="saucer-indicators" aria-hidden="true">
        <VolumeIndicator.Root className="saucer-indicator">
          <VolumeIndicator.Fill className="saucer-indicator-fill">
            <VolumeIndicator.Value />
          </VolumeIndicator.Fill>
        </VolumeIndicator.Root>
        <SeekIndicator.Root className="saucer-indicator">
          <SeekIndicator.Value />
        </SeekIndicator.Root>
      </div>

      {layout && <Rim layout={layout} tilt={tilt} />}

      <SaucerControls tilt={tilt} />

      <ErrorDialog.Root>
        <ErrorDialog.Backdrop className="saucer-dialog-backdrop" />
        <ErrorDialog.Popup className="saucer-dialog">
          <ErrorDialog.Title className="saucer-dialog-title" />
          <ErrorDialog.Description className="saucer-dialog-description" />
          <ErrorDialog.Close className="saucer-dialog-close" render={<button type="button" />} />
        </ErrorDialog.Popup>
      </ErrorDialog.Root>

      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowRight" action="seekStep" />
      <Hotkey keys="ArrowLeft" action="seekStep" />
      <Hotkey keys="l" action="seekStep" />
      <Hotkey keys="j" action="seekStep" />
      <Hotkey keys="ArrowUp" action="volumeStep" />
      <Hotkey keys="ArrowDown" action="volumeStep" />
      <Hotkey keys="0-9" action="seekToPercent" />
      <Hotkey keys="Home" action="seekToPercent" value={0} />
      <Hotkey keys="End" action="seekToPercent" value={100} />
      <Hotkey keys=">" action="speedUp" />
      <Hotkey keys="<" action="speedDown" />
      <Hotkey keys="f" action="toggleFullscreen" />
      <Hotkey keys="c" action="toggleSubtitles" />
      <Hotkey keys="i" action="togglePictureInPicture" />

      <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />

      <StatusAnnouncer className="saucer-sr-only" />
    </Container>
  );
}
