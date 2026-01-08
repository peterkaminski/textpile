// Textpile Worker - Exports Durable Objects
// This file is required for Cloudflare Pages to recognize Durable Objects

export { PostIdAllocator } from './src/PostIdAllocator.js';

// Re-export all functions from the functions directory
// Pages will handle routing automatically
export default {
  async fetch(request, env, ctx) {
    // This is handled by Cloudflare Pages Functions routing
    // Just return a basic response if accessed directly
    return new Response('Textpile - Cloudflare Pages Application', { status: 200 });
  }
};
