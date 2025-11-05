import { createDirectus, rest, readItems } from '@directus/sdk';
import algoliasearch from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Directus client
const directus = createDirectus(process.env.DIRECTUS_URL || 'https://burnes-center.directus.app')
  .with(rest());

// Initialize Algolia client - use admin API key for browsing
// Note: ALGOLIA_ADMIN_API_KEY should have full access, ALGOLIA_API_KEY is search-only
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY || process.env.ALGOLIA_API_KEY
);

// Get Algolia index name from environment or use default
// User confirmed the index name is 'reboot_democracy_blog'
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || 'reboot_democracy_blog';

console.log('🔍 Checking Algolia ingestion for published posts...\n');
console.log(`Using Algolia index: ${ALGOLIA_INDEX_NAME}\n`);

async function getAllPublishedPosts() {
  console.log('📥 Fetching published posts from Directus...');
  
  try {
    const posts = await directus.request(
      readItems('reboot_democracy_blog', {
        fields: ['id', 'title', 'slug', 'status', 'date_created'],
        filter: {
          status: {
            _eq: 'published'
          }
        },
        limit: -1 // Get all
      })
    );
    
    console.log(`✓ Found ${posts.length} published posts in Directus\n`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching posts from Directus:', error);
    throw error;
  }
}

async function getAllAlgoliaRecords() {
  console.log('📥 Fetching records from Algolia...');
  
  try {
    const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
    
    // Use browseObjects - it returns a promise with an async iterator
    const algoliaRecords = [];
    
    // BrowseObjects returns a BrowseResponse with an iterator
    const browse = index.browseObjects();
    
    for await (const hit of browse) {
      algoliaRecords.push(hit);
    }
    
    console.log(`✓ Found ${algoliaRecords.length} records in Algolia\n`);
    return algoliaRecords;
  } catch (error) {
    console.error('❌ Error fetching records from Algolia:', error.message);
    console.error('   Make sure you are using an Admin API Key (ALGOLIA_ADMIN_API_KEY)');
    console.error('   The search API key (ALGOLIA_API_KEY) cannot browse all objects');
    
    // Fallback: Try using search to at least get a count
    console.log('\n🔄 Trying fallback method (search)...');
    try {
      const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
      // Do an empty search to get all records (limited to 1000)
      const searchResponse = await index.search('', {
        hitsPerPage: 1000,
        page: 0
      });
      
      console.log(`⚠️  Found at least ${searchResponse.hits.length} records (search limited to 1000)`);
      console.log(`   Total records in index: ${searchResponse.nbHits || 'unknown'}`);
      console.log('\n   Note: Full comparison requires admin API key for browse operation');
      
      // Return what we found, but note it's incomplete
      return searchResponse.hits || [];
    } catch (searchError) {
      console.error('❌ Search method also failed:', searchError.message);
      throw error; // Throw original error
    }
  }
}

async function compareRecords(directusPosts, algoliaRecords) {
  console.log('🔍 Comparing records...\n');
  
  // Create maps for easier lookup
  const directusSlugs = new Set(directusPosts.map(p => p.slug));
  const algoliaSlugs = new Set(algoliaRecords.map(r => r.slug || r.objectID));
  
  // Find missing posts (in Directus but not in Algolia)
  const missingInAlgolia = directusPosts.filter(post => {
    // Check by slug first, then by objectID
    const inAlgolia = algoliaRecords.some(record => 
      record.slug === post.slug || 
      record.objectID === post.slug ||
      record.objectID === String(post.id)
    );
    return !inAlgolia;
  });
  
  // Find extra records (in Algolia but not in Directus published)
  const extraInAlgolia = algoliaRecords.filter(record => {
    const slug = record.slug || record.objectID;
    const id = record.objectID;
    const inDirectus = directusPosts.some(post => 
      post.slug === slug || 
      String(post.id) === id
    );
    return !inDirectus;
  });
  
  return {
    directusCount: directusPosts.length,
    algoliaCount: algoliaRecords.length,
    missingInAlgolia,
    extraInAlgolia,
    allMatch: missingInAlgolia.length === 0 && extraInAlgolia.length === 0
  };
}

async function main() {
  try {
    const directusPosts = await getAllPublishedPosts();
    const algoliaRecords = await getAllAlgoliaRecords();
    const comparison = await compareRecords(directusPosts, algoliaRecords);
    
    console.log('='.repeat(60));
    console.log('📊 COMPARISON RESULTS');
    console.log('='.repeat(60));
    console.log(`Directus Published Posts: ${comparison.directusCount}`);
    console.log(`Algolia Indexed Records: ${comparison.algoliaCount}`);
    console.log(`Missing in Algolia: ${comparison.missingInAlgolia.length}`);
    console.log(`Extra in Algolia: ${comparison.extraInAlgolia.length}`);
    console.log('='.repeat(60));
    
    if (comparison.allMatch) {
      console.log('\n✅ SUCCESS: All published posts are indexed in Algolia!\n');
    } else {
      if (comparison.missingInAlgolia.length > 0) {
        console.log('\n❌ MISSING POSTS IN ALGOLIA:');
        console.log('-'.repeat(60));
        comparison.missingInAlgolia.forEach((post, index) => {
          console.log(`${index + 1}. [ID: ${post.id}] ${post.title}`);
          console.log(`   Slug: ${post.slug}`);
          console.log(`   Created: ${post.date_created}`);
          console.log('');
        });
      }
      
      if (comparison.extraInAlgolia.length > 0) {
        console.log('\n⚠️  EXTRA RECORDS IN ALGOLIA (not in published Directus posts):');
        console.log('-'.repeat(60));
        comparison.extraInAlgolia.slice(0, 10).forEach((record, index) => {
          console.log(`${index + 1}. [ObjectID: ${record.objectID}] ${record.title || 'No title'}`);
          if (record.slug) console.log(`   Slug: ${record.slug}`);
          console.log('');
        });
        if (comparison.extraInAlgolia.length > 10) {
          console.log(`... and ${comparison.extraInAlgolia.length - 10} more\n`);
        }
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   Total published posts in Directus: ${comparison.directusCount}`);
    console.log(`   Total records in Algolia: ${comparison.algoliaCount}`);
    console.log(`   Posts needing indexing: ${comparison.missingInAlgolia.length}`);
    
    if (comparison.missingInAlgolia.length > 0) {
      console.log('\n💡 ACTION NEEDED: Run the indexing script for missing posts.');
      console.log(`   Missing post IDs: ${comparison.missingInAlgolia.map(p => p.id).join(', ')}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
