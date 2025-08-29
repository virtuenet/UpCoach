import React from 'react';

interface AccordionProps {
  type?: 'single' | 'multiple';
  children: React.ReactNode;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AccordionContentProps {
  children: React.ReactNode;
}

const AccordionContext = React.createContext<{
  openItems: string[];
  toggleItem: (value: string) => void;
}>({ openItems: [], toggleItem: () => {} });

const Accordion = ({ type = 'single', children }: AccordionProps) => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (value: string) => {
    if (type === 'single') {
      setOpenItems(openItems.includes(value) ? [] : [value]);
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter((item) => item !== value)
          : [...openItems, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className="divide-y divide-gray-200">{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({ value, children }: AccordionItemProps) => {
  const ItemContext = React.createContext(value);
  
  return (
    <ItemContext.Provider value={value}>
      <div className="border-b">{children}</div>
    </ItemContext.Provider>
  );
};

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { openItems, toggleItem } = React.useContext(AccordionContext);
    const value = React.useContext(React.createContext(''));
    const isOpen = openItems.includes(value);

    return (
      <button
        ref={ref}
        className={cn(
          'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline',
          className
        )}
        onClick={() => toggleItem(value)}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = ({ children }: AccordionContentProps) => {
  const { openItems } = React.useContext(AccordionContext);
  const value = React.useContext(React.createContext(''));
  const isOpen = openItems.includes(value);

  if (!isOpen) return null;

  return (
    <div className="overflow-hidden text-sm transition-all">
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };