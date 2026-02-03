import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Physics',
          ['Overview', 'Level A - Analytical', 'Level B - Semi-empirical', 'Level C - Numerical', 'Materials'],
          'User Guide',
          ['Getting Started', 'Device Parameters', 'Bias Controls', 'Analysis Plots', 'Export'],
        ],
      },
    },
  },
};

export default preview;
