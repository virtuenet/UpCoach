import React, { createContext, useContext } from 'react';

const passthrough =
  (Tag: keyof JSX.IntrinsicElements = 'div') =>
  ({ children, ...props }: any) =>
    React.createElement(Tag, props, children);

const TabsContext = createContext<{ value: string; onValueChange?: (value: string) => void }>({
  value: '',
});

export const Card = passthrough();
export const CardContent = passthrough();
export const CardHeader = passthrough();
export const CardTitle = passthrough();
export const Badge = passthrough();
export const Alert = passthrough();
export const AlertDescription = passthrough();
export const AlertTitle = passthrough();

export const Button = ({ children, ...props }: any) => (
  <button type="button" {...props}>
    {children}
  </button>
);

export const Tabs = ({ value, onValueChange, children, ...props }: any) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div {...props}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList = passthrough();

export const TabsTrigger = ({ value, children, ...props }: any) => {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  return (
    <button
      type="button"
      data-active={activeValue === value}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, ...props }: any) => {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;
  return <div {...props}>{children}</div>;
};

