import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Supports loading states and full accessibility.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner when true',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      description: 'Button content',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Button Stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

// Size Variations
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// State Variations
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// Comprehensive Examples
export const AllVariants: Story = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button variant="primary">{args.children}</Button>
        <Button variant="secondary">{args.children}</Button>
        <Button variant="outline">{args.children}</Button>
        <Button variant="ghost">{args.children}</Button>
        <Button variant="danger">{args.children}</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for comparison.',
      },
    },
  },
};

export const AllSizes: Story = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="flex items-center space-x-4">
      <Button size="sm">{args.children}</Button>
      <Button size="md">{args.children}</Button>
      <Button size="lg">{args.children}</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together for comparison.',
      },
    },
  },
};

export const InteractiveStates: Story = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button variant="primary">{args.children}</Button>
        <Button variant="primary" loading>{args.children}</Button>
        <Button variant="primary" disabled>{args.children}</Button>
      </div>
      <div className="space-x-4">
        <Button variant="outline">{args.children}</Button>
        <Button variant="outline" loading>{args.children}</Button>
        <Button variant="outline" disabled>{args.children}</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive states including normal, loading, and disabled states.',
      },
    },
  },
};

// Accessibility Testing
export const AccessibilityExample: Story = {
  args: {
    children: 'Save'
  },
  render: (args) => (
    <div className="space-y-4">
      <Button 
        aria-label="Save document" 
        title="Save the current document"
      >
        {args.children}
      </Button>
      <Button 
        variant="danger"
        aria-describedby="delete-warning"
      >
        Delete
      </Button>
      <p id="delete-warning" className="text-sm text-gray-600">
        This action cannot be undone
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of buttons with proper accessibility attributes.',
      },
    },
  },
};