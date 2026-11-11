export default function Loading() {
  return (
    <div className="grid min-h-[60svh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="size-7 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-xs font-medium">Memuat...</span>
      </div>
    </div>
  );
}
