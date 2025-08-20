export function Spinner({ label }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          strokeWidth="4"
          className="opacity-25"
          stroke="currentColor"
          fill="none"
        />
        <path
          d="M4 12a8 8 0 018-8"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-75"
          fill="none"
        />
      </svg>
      {label && <span className="sr-only sm:not-sr-only text-sm">{label}</span>}
    </span>
  );
}
