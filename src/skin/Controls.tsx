import {
  CaptionsButton,
  Controls,
  FullscreenButton,
  Menu,
  MuteButton,
  PiPButton,
  PlaybackRateButton,
  PlaybackRateRadioGroup,
  PlayButton,
  Time,
  Tooltip,
  VolumeSlider,
} from '@videojs/react';
import {
  CaptionsOffIcon,
  CaptionsOnIcon,
  CheckIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PauseIcon,
  PipEnterIcon,
  PipExitIcon,
  PlayIcon,
  RestartIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from '@videojs/react/icons';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import type { Tilt } from './useTilt';

function Tip({ children, label }: { children: ReactElement; label?: ReactNode }) {
  return (
    <Tooltip.Root side="top">
      <Tooltip.Trigger render={children} />
      <Tooltip.Popup className="saucer-popup saucer-tooltip">
        {label ?? <Tooltip.Label />}
        {!label && <Tooltip.Shortcut className="saucer-tooltip-shortcut" />}
      </Tooltip.Popup>
    </Tooltip.Root>
  );
}

function PlayIcons() {
  return (
    <>
      <RestartIcon className="saucer-icon saucer-icon-restart" />
      <PlayIcon className="saucer-icon saucer-icon-play" />
      <PauseIcon className="saucer-icon saucer-icon-pause" />
    </>
  );
}

function TiltIcon() {
  return (
    <svg className="saucer-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="6" y="2.5" width="6.5" height="11" rx="1.5" transform="rotate(18 9 8)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 13.5c1.800 1.700 4.200 2.700 7 2.700s5.200-1 7-2.700" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.300 12.600l1.900.800-.500 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DENIED_HINT = 'Motion access is off for this site. Close Safari completely, reopen this page and tap Allow.';

function TiltButton({ tilt }: { tilt: Tilt }) {
  const [hint, setHint] = useState(false);
  const denied = tilt.status === 'denied';

  // The hint stays up for a few seconds after a refused request, long enough to read on a phone.
  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(false), 6000);
    return () => window.clearTimeout(timer);
  }, [hint]);

  if (tilt.status === 'unsupported') return null;
  const on = tilt.status === 'on';
  const label = denied ? 'Motion access is off' : on ? 'Stop tilt to seek' : 'Tilt to seek';

  return (
    <>
      <Tip label={label}>
        <button
          type="button"
          className="saucer-button saucer-tilt-button"
          aria-label="Tilt to seek"
          aria-pressed={on}
          aria-describedby={hint ? 'saucer-tilt-hint' : undefined}
          data-on={on ? '' : undefined}
          data-denied={denied ? '' : undefined}
          onClick={async () => {
            if (on) {
              tilt.disable();
              return;
            }
            // Ask again every time: the browser may have been reset since it last said no.
            const granted = await tilt.enable();
            setHint(!granted);
          }}
        >
          <TiltIcon />
        </button>
      </Tip>
      {hint && (
        <p id="saucer-tilt-hint" className="saucer-tilt-hint" role="status">
          {DENIED_HINT}
        </p>
      )}
    </>
  );
}

function RateMenu() {
  return (
    <Menu.Root side="top" align="center">
      <PlaybackRateRadioGroup.Root>
        <Tip label="Playback speed">
          <Menu.Trigger
            render={
              <PlaybackRateButton className="saucer-button saucer-rate-button" render={<button type="button" />}>
                <PlaybackRateRadioGroup.Value />
              </PlaybackRateButton>
            }
          />
        </Tip>
        <Menu.Popup className="saucer-popup saucer-menu">
          <Menu.Content className="saucer-menu-content">
            <PlaybackRateRadioGroup.Options
              className="saucer-menu-group"
              renderItem={(props, item) => (
                <Menu.RadioItem className="saucer-menu-item" {...props}>
                  <span>{item.label}</span>
                  <Menu.ItemIndicator forceMount className="saucer-menu-indicator">
                    <CheckIcon className="saucer-icon" />
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              )}
            />
          </Menu.Content>
        </Menu.Popup>
      </PlaybackRateRadioGroup.Root>
    </Menu.Root>
  );
}

/** Everything that sits inside the well: the opening play button and the control bar. */
export function SaucerControls({ tilt }: { tilt: Tilt }) {
  return (
    <Controls.Root>
      <Controls.Content className="saucer-controls">
        <Tooltip.Provider>
          <PlayButton className="saucer-center-play" render={<button type="button" />}>
            <PlayIcons />
          </PlayButton>

          <Controls.Group className="saucer-bar" aria-label="Player controls">
            <Tip>
              <PlayButton className="saucer-button saucer-play-button" render={<button type="button" />}>
                <PlayIcons />
              </PlayButton>
            </Tip>

            <div className="saucer-volume">
              <Tip>
                <MuteButton className="saucer-button saucer-mute-button" render={<button type="button" />}>
                  <VolumeOffIcon className="saucer-icon saucer-icon-volume-off" />
                  <VolumeLowIcon className="saucer-icon saucer-icon-volume-low" />
                  <VolumeHighIcon className="saucer-icon saucer-icon-volume-high" />
                </MuteButton>
              </Tip>
              <VolumeSlider.Root className="saucer-volume-slider" thumbAlignment="edge">
                <VolumeSlider.Track className="saucer-volume-track">
                  <VolumeSlider.Fill className="saucer-volume-fill" />
                </VolumeSlider.Track>
                <VolumeSlider.Thumb className="saucer-volume-thumb" />
              </VolumeSlider.Root>
            </div>

            <Time.Group className="saucer-time">
              <Time.Value className="saucer-time-current" type="current" />
              <Time.Separator className="saucer-time-separator" />
              <Time.Value className="saucer-time-duration" type="duration" />
            </Time.Group>

            <span className="saucer-bar-spacer" />

            <TiltButton tilt={tilt} />

            <Tip>
              <CaptionsButton className="saucer-button saucer-captions-button" render={<button type="button" />}>
                <CaptionsOffIcon className="saucer-icon saucer-icon-captions-off" />
                <CaptionsOnIcon className="saucer-icon saucer-icon-captions-on" />
              </CaptionsButton>
            </Tip>

            <RateMenu />

            <Tip>
              <PiPButton className="saucer-button saucer-pip-button" render={<button type="button" />}>
                <PipEnterIcon className="saucer-icon saucer-icon-pip-enter" />
                <PipExitIcon className="saucer-icon saucer-icon-pip-exit" />
              </PiPButton>
            </Tip>

            <Tip>
              <FullscreenButton className="saucer-button saucer-fullscreen-button" render={<button type="button" />}>
                <FullscreenEnterIcon className="saucer-icon saucer-icon-fullscreen-enter" />
                <FullscreenExitIcon className="saucer-icon saucer-icon-fullscreen-exit" />
              </FullscreenButton>
            </Tip>
          </Controls.Group>
        </Tooltip.Provider>
      </Controls.Content>
    </Controls.Root>
  );
}
