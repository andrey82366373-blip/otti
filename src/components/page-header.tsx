type PageHeaderProps = {
  title: string;
  description?: string;
};

/** Заголовок экрана с короткой подписью. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
      {description && (
        <p className="mt-1 text-muted-foreground md:text-lg">{description}</p>
      )}
    </div>
  );
}
