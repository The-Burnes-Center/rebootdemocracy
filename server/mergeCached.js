const fs = require('fs-extra')
const path = require('path')

async function mergeCached() {
  // Assume the backup of dist/blog was saved to "backup/blog"
  const backupDir = path.resolve(process.cwd(), 'backup', 'blog')
  const newDir = path.resolve(process.cwd(), 'dist', 'blog')

  // Recursively copy any files from the backup that don't exist in the new "dist/blog"
  await fs.copy(backupDir, newDir, { overwrite: false, errorOnExist: false })
  console.log('Merged cached blog pages back into dist/blog.')
}

mergeCached()
  .catch(err => {
    console.error('Error while merging cached pages:', err)
    process.exit(1)
  })