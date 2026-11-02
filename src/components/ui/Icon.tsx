import type { ReactNode } from 'react'
export type IconName =
  | 'headphones'
  | 'book'
  | 'mistakes'
  | 'history'
  | 'settings'
  | 'chevron'
  | 'arrow'
  | 'volume'
  | 'play'
  | 'pause'
  | 'shuffle'
  | 'check'
  | 'close'
  | 'help'
  | 'reset'
  | 'leaf'
  | 'keyboard'
  | 'download'
  | 'search'
  | 'github'
const PATHS: Record<IconName, ReactNode> = {
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .297C5.37 .297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.084-.729.084-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.334-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.042.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  ),
  headphones: (
    <>
      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="12" width="4" height="8" rx="2" />
      <rect x="17" y="12" width="4" height="8" rx="2" />
    </>
  ),
  book: (
    <>
      <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15" />
      <path d="M5 8h3m8 0h3M5 12h3m8 0h3" />
    </>
  ),
  mistakes: (
    <>
      <rect x="5" y="3" width="15" height="19" rx="2" />
      <path d="M9 3v7l3-2 3 2V3M3 7h3M3 12h3M3 17h3m7-3v3m0 2h.01" />
    </>
  ),
  history: (
    <>
      <path d="M3 11a9 9 0 1 1 2 7M3 5v6h6" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 3h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-3Z" />
      <circle cx="11.5" cy="11.5" r="3" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
  volume: (
    <>
      <path d="m11 4-5 4H3v8h3l5 4V4Z" />
      <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8V4Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  shuffle: (
    <path d="m18 3 3 3-3 3M3 6h3c6 0 6 12 12 12h3m-3-3 3 3-3 3M3 18h3c2 0 4-3 6-6s4-6 6-6h3" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3m0 3h.01" />
    </>
  ),
  reset: <path d="M4 10a8 8 0 1 1 0 5M4 4v6h6" />,
  leaf: (
    <>
      <path d="M20 3C8 1 2 8 5 15s17 3 15-12Z" />
      <path d="M3 21 15 9m-9 9 1-7m3 4h7" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
    </>
  ),
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
