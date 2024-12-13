// cache-plugin.js

const { join } = require('path');

module.exports = {
  onPreBuild: async ({ utils }) => {
    // Restore the cached 'dist' directory if it doesn't exist locally
    const didRestore = await utils.cache.restore('./dist');
    if (didRestore) {
      console.log('Restored cached "dist" directory.');
    } else {
      console.log('No cache found for "dist" directory.');
    }
  },
  onPostBuild: async ({ utils }) => {
    // Save the 'dist' directory to cache
    const didSave = await utils.cache.save('./dist');
    if (didSave) {
      console.log('Saved "dist" directory to cache.');
    } else {
      console.log('No "dist" directory found to cache.');
    }
  },
};