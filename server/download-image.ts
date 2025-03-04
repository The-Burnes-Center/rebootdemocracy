import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

export async function downloadAndStoreImage(remoteUrl: string): Promise<string> {
  try {
    const urlObj = new URL(remoteUrl)
    const filename = path.basename(urlObj.pathname)
    console.log(remoteUrl)
    const imagesDir = path.resolve(process.cwd(), 'public', 'images')
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }
    const localFilePath = path.join(imagesDir, filename)
    
    // If the image file already exists, skip downloading
    if (fs.existsSync(localFilePath)) {
      console.log('Image already exists at:', localFilePath, '. Skipping download.');
      return 'images/' + filename;
    }

    const res = await fetch(remoteUrl)
    if (!res.ok) {
      console.error('Image download failed:', res.statusText)
      return remoteUrl
    }
    
    // Use arrayBuffer() and convert it to a Buffer.
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    fs.writeFileSync(localFilePath, buffer)
    console.log('Image downloaded and stored at:', localFilePath)
    return 'images/' + filename
  } catch (error) {
    console.error('Error in downloadAndStoreImage:', error)
    return remoteUrl
  }
}