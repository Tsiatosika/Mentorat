export function Logo({ size = 40 }: { size?: number }) {
  const iconSize = Math.round(size * 0.55);

  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--accent-soft)',
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 5.5C3 4.67 3.67 4 4.5 4H10C10.83 4 11.5 4.67 11.5 5.5V19C11.5 18.45 11.05 18 10.5 18H4.5C3.67 18 3 17.33 3 16.5V5.5Z"
          fill="var(--accent)"
        />
        <path
          d="M21 5.5C21 4.67 20.33 4 19.5 4H14C13.17 4 12.5 4.67 12.5 5.5V19C12.5 18.45 12.95 18 13.5 18H19.5C20.33 18 21 17.33 21 16.5V5.5Z"
          fill="var(--accent)"
          opacity="0.55"
        />
        <rect x="15.5" y="2" width="3" height="9" rx="0.5" fill="var(--warm)" />
        <path d="M15.5 11L17 9.7L18.5 11V2H15.5V11Z" fill="var(--warm)" />
      </svg>
    </div>
  );
}