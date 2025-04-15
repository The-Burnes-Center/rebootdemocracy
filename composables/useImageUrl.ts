export function getImageUrl(
  image: { filename_disk?: string } | null | undefined,
  width: number = 512
): string {
  if (!image?.filename_disk) {
    return "/images/exampleImage.png"; 
  }

  const s3BaseUrl = "https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/";
  const fullS3Url = s3BaseUrl + image.filename_disk;

  // Use Netlify Image CDN in production
  return process.env.NODE_ENV === "production"
    ? `/.netlify/images?url=${encodeURIComponent(fullS3Url)}&w=${width}`
    : fullS3Url;
}
