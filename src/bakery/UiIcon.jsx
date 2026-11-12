const paths = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v11H3Z" />
      <path d="M9 21v-8h6v8" />
    </>
  ),
  play: <path d="m8 4 13 8-13 8Z" />,
  arrow: (
    <>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </>
  ),
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Z" />
      <path d="M16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16" />
    </>
  ),
  mute: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Z" />
      <path d="m16 9 6 6m0-6-6 6" />
    </>
  ),
  hand: (
    <>
      <path d="M8 12V4a2 2 0 0 1 4 0v7l1-4a2 2 0 0 1 3 1v3l1-2a2 2 0 0 1 3 2v4c0 4-2 7-6 7h-2c-3 0-5-2-6-4l-3-4c-2-3 1-5 3-2l2 2" />
    </>
  ),
  count: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
    </>
  ),
  book: (
    <>
      <path d="M12 6C8 3 4 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-2-1-6-1-10 2Zm0 0v14" />
    </>
  ),
  gift: (
    <>
      <path d="M3 10h18v11H3ZM2 6h20v4H2Zm10 0v15" />
      <path d="M12 6C4 7 4 0 8 2c2 0 4 4 4 4Zm0 0c8 1 8-6 4-4-2 0-4 4-4 4Z" />
    </>
  ),
  oven: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 8h18M8 5h1m5 0h2" />
      <rect x="7" y="11" width="10" height="7" rx="1" />
    </>
  ),
  settings: (
    <>
      <path d="M5 3v18M12 3v18M19 3v18" />
      <path d="M2 8h6m1 8h6m1-10h6" />
    </>
  ),
  check: <path d="m4 12 5 5L21 5" />,
  plus: <path d="M12 4v16M4 12h16" />,
  minus: <path d="M4 12h16" />,
};

export default function UiIcon({ name, className = "" }) {
  return (
    <svg
      className={`ui-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
