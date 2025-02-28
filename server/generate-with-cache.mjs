module.exports = {
  onPreBuild: async ({ utils }) => {
    const didRestore = await utils.cache.restore('.cache/dist');
    if (didRestore) {
      console.log('Restored cached ".cache/dist" directory.');
    } else {
      console.log('No cache found for ".cache/dist" directory.');
    }
  },
  onPostBuild: async ({ utils }) => {
    const didSave = await utils.cache.save('.cache/dist');
    if (didSave) {
      console.log('Saved ".cache/dist" directory to cache.');
    } else {
      console.log('No ".cache/dist" directory found to cache.');
    }
  },
};