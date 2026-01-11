// KV namespace utilities for Textpile

/**
 * Check if KV namespace is properly configured.
 * Returns an error response if KV is not available.
 * 
 * @param {object} env - Environment bindings
 * @returns {Response|null} - Error response if KV not configured, null if OK
 * 
 * @example
 * const kvError = checkKvNamespace(env);
 * if (kvError) return kvError;
 */
export function checkKvNamespace(env) {
  if (!env.KV) {
    return Response.json({
      error: "KV namespace not configured",
      message: "The KV namespace binding is missing. Please configure it in Cloudflare Pages Settings → Functions → KV namespace bindings. Set the variable name to 'KV' and select or create a KV namespace.",
      docs: "https://developers.cloudflare.com/pages/functions/bindings/#kv-namespaces"
    }, { status: 500 });
  }
  return null;
}
