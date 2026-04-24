type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-[#101014] px-6 py-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#d4ff00]">{eyebrow}</p>
          <div className="mt-2 max-w-3xl">
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-3 text-base leading-7 text-zinc-400">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
