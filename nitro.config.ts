/**
 * Nitro Configuration for Netlify Deployment
 * 
 * This file ensures Nitro uses the 'netlify' preset, which creates
 * a server handler that includes all server/api/ routes as Netlify functions.
 * 
 * The server handler will show up as "server handler" (system) in Netlify Functions.
 * All routes in server/api/ (like revalidate.post.ts) are included in this handler.
 */
export default {
  preset: 'netlify'
}

