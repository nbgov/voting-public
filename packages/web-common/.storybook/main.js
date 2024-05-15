module.exports = {
  "stories": ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)", "../src/**/*.story.@(js|jsx|ts|tsx)"],
  "addons": ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/addon-mdx-gfm"],
  "docs": {
    "autodocs": true
  },
  "framework": {
    name: "@storybook/react-webpack5",
    options: {}
  },
  features: {
    storyStoreV7: true
  }
};