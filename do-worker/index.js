// Textpile Durable Object Worker
// This Worker exports the PostIdAllocator Durable Object

export { PostIdAllocator } from '../src/PostIdAllocator.js';

export default {
  async fetch(request, env, ctx) {
    return new Response('Textpile Durable Object Worker', { status: 200 });
  }
};
