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
    plugins.push(new RsdoctorRspackPlugin({
      // Options: https://rsdoctor.dev/config/options
    }));
  }

  return {
    plugins,
  };
});
