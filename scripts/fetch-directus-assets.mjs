#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { load } from 'cheerio'; // ← Updated import

////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////

// Replace these URLs as needed:
const DIRECTUS_BASE_URL = 'https://content.thegovlab.com';
const CONTENT_DIRECTUS_URL = 'https://content.thegovlab.com'; 
// Regex to detect images from your content directus domain:
const ASSET_URL_REGEX = /https:\/\/content\.thegovlab\.com\/assets\/([^"?#]+)/gi;

// Create the Directus client for your main data
const directus = createDirectus(DIRECTUS_BASE_URL).with(rest());

// Where downloaded files will be stored locally
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

////////////////////////////////////////////////////////////////////////////////
// Main functions to fetch directus items
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

  // Build up the set of filenames to download from the explicit fields
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
    // look in post.content for <img> references
    if (post?.content) {
      await fetchDirectusImagesInHtml(post.content);
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
  // parse HTML content for directus images
  if (post?.content) {
    await fetchDirectusImagesInHtml(post.content);
  }

  // Download the explicitly referenced files
  await downloadFiles([...assetsToDownload]);
}

////////////////////////////////////////////////////////////////////////////////
// Helpers for parsing <img> from HTML content, requesting metadata, and downloading
////////////////////////////////////////////////////////////////////////////////

/**
 * Check for <img src="https://content.thegovlab.com/assets/..."> references,
 * extract the ID or filename, call /files if needed, then download the assets.
 */
async function fetchDirectusImagesInHtml(htmlContent) {
  const $ = load(htmlContent); // ← Updated usage
  const assets = new Set();

  // Check all relevant attributes
  $('img[src], [style], [srcset]').each((_, element) => {
    // Check src attributes
    const src = $(element).attr('src');
    if (src) checkAssetUrl(src, assets);

    // Check inline styles
    const style = $(element).attr('style');
    if (style) checkCssUrls(style, assets);

    // Check srcset
    const srcset = $(element).attr('srcset');
    if (srcset) checkSrcset(srcset, assets);
  });

  for (const idOrFilename of assets) {
    await fetchAndDownloadDirectusFile(idOrFilename);
  }
}

function checkAssetUrl(url, set) {
  const match = url.match(/https:\/\/content\.thegovlab\.com\/assets\/([^?#]+)/);
  if (match) set.add(match[1]);
}

function checkCssUrls(css, set) {
  const matches = css.matchAll(/url\(["']?(https:\/\/content\.thegovlab\.com\/assets\/[^"')?#]+)/gi);
  for (const match of matches) checkAssetUrl(match[1], set);
}

function checkSrcset(srcset, set) {
  srcset.split(',')
    .map(entry => entry.trim().split(/\s+/)[0])
    .forEach(url => checkAssetUrl(url, set));
}

/**
 * Given a possible Directus ID or a filename like "123abc.png", 
 * request /files/<id> if it looks like a pure UUID, 
 * get the filename_disk, then download the file.
 */
async function fetchAndDownloadDirectusFile(fileIdOrFilename) {
  if (!fileIdOrFilename) return;
  // UUID test
  const isUuidOnly = /^[0-9a-f-]{36}$/i.test(fileIdOrFilename);
  let diskFilename = fileIdOrFilename;

  if (isUuidOnly) {
    try {
      const metadata = await fetch(`${CONTENT_DIRECTUS_URL}/files/${fileIdOrFilename}`);
      if (!metadata.ok) {
        console.error(`Failed to get metadata for ${fileIdOrFilename} , status: ${metadata.status}`);
        return;
      }
      const { data } = await metadata.json();
      diskFilename = data?.filename_disk;
      if (!diskFilename) {
        console.error(`filename_disk not found for ${fileIdOrFilename}`);
        return;
      }
    } catch (err) {
      console.error(`Error fetching metadata for ${fileIdOrFilename}:`, err);
      return;
    }
  }

  await downloadDirectusFile(diskFilename);
}

/**
 * Download a single directus file from content.thegovlab.com/assets/<filename>
 * into our local /public/assets folder.
 */
async function downloadDirectusFile(filenameDisk) {
  if (!filenameDisk) return;
  const remoteUrl = `${CONTENT_DIRECTUS_URL}/assets/${filenameDisk}`;
  const localFilePath = path.join(ASSETS_DIR, filenameDisk);

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
 * Download an array of directus filenames (already known) into /public/assets.
 */
async function downloadFiles(filenames) {
  if (!filenames || filenames.length === 0) {
    console.log('No additional assets to download (explicit fields).');
    return;
  }

  await fs.mkdir(ASSETS_DIR, { recursive: true });

  for (const filename of filenames) {
    const remoteUrl = `${DIRECTUS_BASE_URL}/assets/${filename}`;
    const localFilePath = path.join(ASSETS_DIR, filename);

    console.log(`Downloading asset: ${remoteUrl} -> ${localFilePath}`);
    const response = await fetch(remoteUrl);

    if (!response.ok) {
      console.error(`Failed to download asset: ${remoteUrl}. Status: ${response.status}`);
      continue;
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(localFilePath, Buffer.from(buffer));
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
  } catch (err) {
    console.error('Error in fetch-directus-assets:', err);
    process.exit(1);
  }
})();