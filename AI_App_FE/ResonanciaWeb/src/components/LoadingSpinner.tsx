export default function LoadingSpinner({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="relative">
        <div className="cosmic-spinner" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
      </div>
      <p className="text-purple-300 text-sm animate-pulse">{text}</p>
    </div>
  );
}
