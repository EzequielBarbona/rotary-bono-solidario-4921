export function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M12 3a9 9 0 00-7.75 13.5L3 21l4.65-1.22A9 9 0 1012 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.8c.1-.6.6-.6.9-.6h.5c.2 0 .5 0 .7.5.2.5.7 1.6.7 1.8s0 .3-.1.5c-.1.2-.2.3-.4.5-.1.2-.3.3-.1.6.2.4.9 1.4 1.9 2.2 1.3 1 2.3 1.4 2.6 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.6.7 1.8.9.2.1.4.2.4.4 0 .2 0 1-.4 1.5-.4.5-1.4 1-2.4.9-1.7-.2-3.4-1-4.7-2.3-1.1-1-1.9-2.1-2.3-3.7-.1-.5-.1-1 0-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}
