import type { Preview } from '@storybook/react';
import '../src/styles/globals.css'; // Import any global styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      story: {
        inline: true,
      },
    },
    // Add viewport configurations for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '812px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
  },
  // Global decorators for consistent styling
  decorators: [
    (Story) => (
      <div style={{ 
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '1rem',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;