import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface TabNavProps<T extends string> {
  tabs: ReadonlyArray<TabDefinition<T>>;
  activeTab: T;
  onChange: (tab: T) => void;
}

/** ID of the panel controlled by a tab, shared with the content region. */
export function tabPanelId(tab: string): string {
  return `panel-${tab}`;
}

export function tabButtonId(tab: string): string {
  return `tab-${tab}`;
}

/**
 * WAI-ARIA tablist with roving tabindex and Arrow/Home/End keyboard navigation.
 */
export function TabNav<T extends string>({ tabs, activeTab, onChange }: TabNavProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const nextIndex = (index + tabs.length) % tabs.length;
    onChange(tabs[nextIndex].id);
    buttonRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyActions: Record<string, () => void> = {
      ArrowRight: () => focusTab(index + 1),
      ArrowLeft: () => focusTab(index - 1),
      Home: () => focusTab(0),
      End: () => focusTab(tabs.length - 1),
    };
    const action = keyActions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <nav className="no-print border-b border-slate-200 bg-white" aria-label="Primary">
      <div
        role="tablist"
        aria-label="VayuNex sections"
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
      >
        {tabs.map((tab, index) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              id={tabButtonId(tab.id)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={tabPanelId(tab.id)}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition focus-visible:bg-slate-100 focus-visible:outline-none ${
                active
                  ? 'border-slate-900 font-semibold text-slate-900'
                  : 'border-transparent font-medium text-slate-600 hover:text-slate-900'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
