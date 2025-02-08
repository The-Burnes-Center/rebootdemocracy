#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { load } from 'cheerio'; // For parsing HTML content

////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////

// Primary Directus base domain
const DIRECTUS_BASE_URL = 'https://dev.thegovlab.com';

/**
 * This is your original content domain for "regular" images
 * found outside of .blog-content (or for standard use).
 */
const CONTENT_DIRECTUS_URL = 'https://dev.thegovlab.com';

/**
 * NEW: second domain for ".blog-content" HTML.
 * Anything discovered within the .blog-content container
 * will be downloaded from this URL instead.
 */
const BLOG_CONTENT_DIRECTUS_URL = 'https://content.thegovlab.com';

/**
 * If you always want to fetch a fallback image, specify it here.
 * If your fallback is a plain UUID (e.g., '4650f4e2-6cc2-407b-ab01-b74be4838235'),
 * you can omit the .png extension and let metadata supply it. Or, if you know
 * it's definitely .png, keep it in the filename as shown below.
 */
const ALWAYS_DOWNLOAD_FALLBACK_FILE = '4650f4e2-6cc2-407b-ab01-b74be4838235.png';

/**
 * Where downloaded files will be stored. Changed to dist/assets
 * because you're building your site there.
 */
const ASSETS_DIR = path.join(process.cwd(), 'dist', 'assets');

// Create the Directus client for main data
const directus = createDirectus(DIRECTUS_BASE_URL).with(rest());

////////////////////////////////////////////////////////////////////////////////
// Main fetch logic
////////////////////////////////////////////////////////////////////////////////

/**
 * Fetch and download assets for ALL published posts (full build).
 */
async function fetchAllAssets() {
  console.log('No SLUG_TO_BUILD provided. Fetching ALL published assets...');
  const data = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: [
        'image.*',
        'audio_version.*',
        'authors.*.*',
        'authors.team_id.Headshot.*',
        'content',
      ],
      filter: { status: { _eq: 'published' } },
      limit: -1,
    })
  );

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('No blog posts found in Directus. Exiting.');
    return;
  }

  // Build up a set of filenames/IDs to download from the fields
  const allFilenames = new Set();
  for (const post of data) {
    // post image
    if (post?.image?.filename_disk) {
      allFilenames.add(post.image.filename_disk);
    }
    // post audio
    if (post?.audio_version?.filename_disk) {
      allFilenames.add(post.audio_version.filename_disk);
    }
    // authors' headshots
    if (Array.isArray(post.authors)) {
      for (const author of post.authors) {
        if (author?.team_id?.Headshot?.filename_disk) {
          allFilenames.add(author.team_id.Headshot.filename_disk);
        }
      }
    }

    // content might have <img> references outside of .blog-content
    if (post?.content) {
      // Default parse (content domain)
      await fetchDirectusImagesInHtml(post.content);

      // If you also want to parse for .blog-content and pull from second domain:
      await fetchBlogContentImagesInHtml(post.content);
    }
  }

  // Download the explicitly referenced files
  await downloadFiles([...allFilenames]);
}

/**
 * Fetch and download assets for a single slug (incremental build).
 */
async function fetchAssetsForSlug(slug) {
  console.log(`SLUG_TO_BUILD provided. Fetching assets for slug: "${slug}"`);
  const { data } = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: [
        'image.*',
        'audio_version.*',
        'authors.*.*',
        'authors.team_id.Headshot.*',
        'content',
      ],
      filter: {
        slug: { _icontains: slug },
        status: { _eq: 'published' },
      },
      limit: 1,
    })
  );

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error(`No blog post found for slug: ${slug}. Exiting.`);
    return;
  }

  const post = data[0];
  const assetsToDownload = new Set();

  // explicit post image
  if (post?.image?.filename_disk) {
    assetsToDownload.add(post.image.filename_disk);
  }
  // explicit post audio
  if (post?.audio_version?.filename_disk) {
    assetsToDownload.add(post.audio_version.filename_disk);
  }
  // authors' headshots
  if (Array.isArray(post.authors)) {
    for (const author of post.authors) {
      if (author?.team_id?.Headshot?.filename_disk) {
        assetsToDownload.add(author.team_id.Headshot.filename_disk);
      }
    }
  }

  // parse HTML content
  if (post?.content) {
    // Normal parse
    await fetchDirectusImagesInHtml(post.content);

    // Additional parse for .blog-content from second domain
    await fetchBlogContentImagesInHtml(post.content);
  }

  // Download the explicitly referenced files
  await downloadFiles([...assetsToDownload]);
}

////////////////////////////////////////////////////////////////////////////////
// HTML parsing helpers
////////////////////////////////////////////////////////////////////////////////

/**
 * Parse the given HTML for <img>, inline CSS, srcset, etc.
 * and download from the DEFAULT domain (CONTENT_DIRECTUS_URL).
 */
async function fetchDirectusImagesInHtml(htmlContent) {
  const $ = load(htmlContent);
  const assets = new Set();

  // Check all relevant attributes in the entire HTML
  $('img[src], [style], [srcset]').each((_, element) => {
    // src
    const src = $(element).attr('src');
    if (src) checkAssetUrl(src, assets);

    // style
    const style = $(element).attr('style');
    if (style) checkCssUrls(style, assets);

    // srcset
    const srcset = $(element).attr('srcset');
    if (srcset) checkSrcset(srcset, assets);
  });

  // For each discovered asset, fetch from the standard domain
  for (const idOrFilename of assets) {
    await fetchAndDownloadDirectusFile(idOrFilename, CONTENT_DIRECTUS_URL);
  }
}

/**
 * NEW: This function looks ONLY within .blog-content container
 * and downloads from the second domain: BLOG_CONTENT_DIRECTUS_URL.
 */
async function fetchBlogContentImagesInHtml(htmlContent) {
  const $ = load(htmlContent);
  const assets = new Set();

  // Only parse inside .blog-content
  const $blogContainer = $('.blog-content');
  $blogContainer.find('img[src], [style], [srcset]').each((_, element) => {
    const src = $(element).attr('src');
    if (src) checkAssetUrl(src, assets);

    const style = $(element).attr('style');
    if (style) checkCssUrls(style, assets);

    const srcset = $(element).attr('srcset');
    if (srcset) checkSrcset(srcset, assets);
  });

  // For each discovered asset, download it from BLOG_CONTENT_DIRECTUS_URL
  for (const idOrFilename of assets) {
    await fetchAndDownloadDirectusFile(idOrFilename, BLOG_CONTENT_DIRECTUS_URL);
  }
}

/**
 * Check a single asset URL for matches, and if found, add the directus file ID
 * or filename to the set so we can fetch it later.
 */
function checkAssetUrl(url, set) {
  // Generic pattern or your original domain pattern:
  // Feel free to adjust if you have a different domain for the default parse
  const match = url.match(/https?:\/\/[^/]+\/assets\/([^?#]+)/);
  if (match) set.add(match[1]);
}

/**
 * Check inline styles for "url( ... )" references and gather them.
 */
function checkCssUrls(css, set) {
  // For example, background-image: url('https://xyz.com/assets/...')
  const matches = css.matchAll(/url\(["']?(https?:\/\/[^"')?#]+)/gi);
  for (const match of matches) {
    checkAssetUrl(match[1], set);
  }
}

/**
 * Parse a srcset string, which could look like "url1 1x, url2 2x", and gather them.
 */
function checkSrcset(srcset, set) {
  srcset
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .forEach((url) => checkAssetUrl(url, set));
}

////////////////////////////////////////////////////////////////////////////////
// Downloading files
////////////////////////////////////////////////////////////////////////////////

/**
 * Universal: given a file ID or directus filename, do:
 *   1) If it's a plain UUID, fetch metadata to get the actual filename_disk
 *   2) Download from the specified baseDomain (defaults to CONTENT_DIRECTUS_URL)
 */
async function fetchAndDownloadDirectusFile(
  fileIdOrFilename,
  baseDomain = CONTENT_DIRECTUS_URL
) {
  if (!fileIdOrFilename) return;

  const isUuidOnly = /^[0-9a-f-]{36}$/i.test(fileIdOrFilename);
  let diskFilename = fileIdOrFilename;
  let extension = '';

  // If it’s just a UUID, fetch metadata from the chosen domain
  if (isUuidOnly) {
    try {
      const metadataUrl = `${baseDomain}/files/${fileIdOrFilename}`;
      const metadata = await fetch(metadataUrl);
      if (!metadata.ok) {
        console.error(`Failed to get metadata for ${fileIdOrFilename}, status: ${metadata.status}`);
        return;
      }
      const { data } = await metadata.json();
      if (!data?.filename_disk) {
        console.error(`filename_disk not found for ${fileIdOrFilename}`);
        return;
      }
      diskFilename = data.filename_disk;
    } catch (err) {
      console.error(`Error fetching metadata for ${fileIdOrFilename}:`, err);
      return;
    }
  }

  // Attempt to parse the extension
  const dotIndex = diskFilename.lastIndexOf('.');
  if (dotIndex !== -1) {
    extension = diskFilename.slice(dotIndex + 1).toLowerCase();
  }

  // If it was a UUID, store it as <uuid>.<extension>, else keep original
  let localFileName;
  if (isUuidOnly) {
    localFileName = `${fileIdOrFilename}.${extension || 'dat'}`;
  } else {
    localFileName = diskFilename;
  }

  const localFilePath = path.join(ASSETS_DIR, localFileName);

  // Skip if we already have it
  try {
    await fs.stat(localFilePath);
    console.log(`File already exists, skipping: ${localFilePath}`);
    return;
  } catch {
    // proceed
  }

  // If you want a forced width=800, you could do:
  const remoteUrl = `${baseDomain}/assets/${diskFilename}?width=800`;
  // For now, we do no transformations:
  // const remoteUrl = `${baseDomain}/assets/${diskFilename}`;

  console.log(`Downloading file: ${remoteUrl} -> ${localFilePath}`);
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    console.error(`Failed to download ${remoteUrl}. Status: ${response.status}`);
    return;
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(localFilePath, Buffer.from(buffer));
}

/**
 * Download an array of directus filenames (already known) into /dist/assets,
 * skipping if they've already been downloaded.
 */
async function downloadFiles(filenames) {
  if (!filenames || filenames.length === 0) {
    console.log('No additional assets to download (explicit fields).');
    return;
  }
  for (const filename of filenames) {
    // pass with no second arg to fetch from CONTENT_DIRECTUS_URL
    await fetchAndDownloadDirectusFile(filename);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Main entry point
////////////////////////////////////////////////////////////////////////////////

(async function main() {
  const slugToBuild = process.env.SLUG_TO_BUILD?.trim();
  try {
    if (!slugToBuild) {
      // Full site fetch
      await fetchAllAssets();
    } else {
      // Incremental fetch for one slug
      await fetchAssetsForSlug(slugToBuild.toLowerCase());
    }

    // Always download your fallback file:
    await fetchAndDownloadDirectusFile(ALWAYS_DOWNLOAD_FALLBACK_FILE);

    console.log('Asset fetching complete.');
  } catch (err) {
    console.error('Error in fetch-directus-assets:', err);
    process.exit(1);
  }
})();