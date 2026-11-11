export function Skeleton({ className = 'h-4 w-full', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-3 ${className}`.trim()}
      {...props}
    />
  );
}

export default Skeleton;

