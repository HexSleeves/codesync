import { defineConfig } from '@meteorjs/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

/**
 * Rspack configuration for Meteor projects.
 */
export default defineConfig(Meteor => {
  const plugins = [];

  if (process.env.RSDOCTOR) {
    plugins.push(new RsdoctorRspackPlugin({}));
  }

  return {
    plugins,
    performance: {
      hints: Meteor.isProduction ? 'warning' : false,
      maxAssetSize: 500000,
      maxEntrypointSize: 600000,
    },
  };
});
