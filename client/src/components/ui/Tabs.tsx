import clsx from 'clsx';

interface TabsProps {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-ink-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2',
            tab.id === active
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
