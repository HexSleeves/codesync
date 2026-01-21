import { defineConfig } from '@meteorjs/rspack';

/**
 * Rspack configuration for Meteor projects.
 * Using Rspack for faster builds (Rust-based bundler).
 */
export default defineConfig(Meteor => {
  return {
    // Keep it minimal - let @meteorjs/rspack handle most config
  };
});
