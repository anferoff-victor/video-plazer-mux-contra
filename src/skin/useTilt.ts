import { useCallback, useEffect, useRef, useState } from 'react';

export type TiltStatus = 'unsupported' | 'off' | 'on' | 'denied';

export interface Tilt {
  status: TiltStatus;
  /**
   * Gravity as the screen sees it, relative to how the device was held when tilt was switched on:
   * `x` grows as the right edge of the screen drops, `y` as the bottom edge drops. Roughly −1 to 1.
   */
  gravity: { current: { x: number; y: number } };
  /** Resolves to whether motion access was granted. */
  enable: () => Promise<boolean>;
  disable: () => void;
  /** Take the current pose as "level". */
  recenter: () => void;
}

interface PermissionCapable {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

const RAD = Math.PI / 180;

function isSupported(): boolean {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
  // Desktop browsers expose the event but never fire it with real data; only offer tilt on touch devices.
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

/**
 * Reads the device's orientation sensors and turns them into a 2D gravity vector in screen space.
 * Nothing is requested until `enable()` is called from a user gesture, which iOS requires.
 */
export function useTilt(): Tilt {
  const [status, setStatus] = useState<TiltStatus>('off');
  const gravity = useRef({ x: 0, y: 0 });
  const raw = useRef<{ beta: number; gamma: number } | null>(null);
  const base = useRef<{ beta: number; gamma: number } | null>(null);

  useEffect(() => {
    if (!isSupported()) setStatus('unsupported');
  }, []);

  useEffect(() => {
    if (status !== 'on') return;

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      raw.current = { beta: event.beta, gamma: event.gamma };
      if (!base.current) base.current = { ...raw.current };

      const gx = Math.sin((event.gamma - base.current.gamma) * RAD);
      const gy = Math.sin((event.beta - base.current.beta) * RAD);
      const angle = (screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0) as number;

      // Map device axes onto the screen as it is currently rotated.
      switch (((angle % 360) + 360) % 360) {
        case 90:
          gravity.current = { x: gy, y: -gx };
          break;
        case 180:
          gravity.current = { x: -gx, y: -gy };
          break;
        case 270:
          gravity.current = { x: -gy, y: gx };
          break;
        default:
          gravity.current = { x: gx, y: gy };
      }
    };

    const onRotate = () => {
      base.current = null;
      gravity.current = { x: 0, y: 0 };
    };

    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('orientationchange', onRotate);
    screen.orientation?.addEventListener?.('change', onRotate);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', onRotate);
      screen.orientation?.removeEventListener?.('change', onRotate);
      gravity.current = { x: 0, y: 0 };
    };
  }, [status]);

  const enable = useCallback(async () => {
    if (!isSupported()) {
      setStatus('unsupported');
      return false;
    }
    const request = (DeviceOrientationEvent as unknown as PermissionCapable).requestPermission;
    if (typeof request === 'function') {
      try {
        const result = await request.call(DeviceOrientationEvent);
        if (result !== 'granted') {
          setStatus('denied');
          return false;
        }
      } catch {
        setStatus('denied');
        return false;
      }
    }
    base.current = null;
    setStatus('on');
    return true;
  }, []);

  const disable = useCallback(() => {
    setStatus((current) => (current === 'on' ? 'off' : current));
  }, []);

  const recenter = useCallback(() => {
    base.current = raw.current ? { ...raw.current } : null;
    gravity.current = { x: 0, y: 0 };
  }, []);

  return { status, gravity, enable, disable, recenter };
}
