type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-6 lg:px-8">
      <p className="text-sm font-medium text-teal-700">{eyebrow}</p>
      <div className="mt-2 max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>
    </header>
  );
}
