type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "Something needs attention",
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded border border-red-500/30 bg-red-500/10 p-5 text-red-100">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-100/80">{message}</p>
    </div>
  );
}
