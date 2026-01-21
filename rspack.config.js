import { defineConfig } from '@meteorjs/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

/**
 * Rspack configuration for Meteor projects.
 * Using Rspack for faster builds (Rust-based bundler).
 */
export default defineConfig(Meteor => {
  const plugins = [];

  // Enable Rsdoctor for bundle analysis when RSDOCTOR=true
  if (process.env.RSDOCTOR) {
    plugins.push(new RsdoctorRspackPlugin({}));
  }

  return {
    plugins,
    performance: {
      // Relax size warnings - lazy loading handles the splitting
      hints: Meteor.isProduction ? 'warning' : false,
      maxAssetSize: 400000,
      maxEntrypointSize: 500000,
    },
  };
});
