// Augment the Cloudflare Env with secrets not present in wrangler.jsonc.
// wrangler types only generates bindings declared in config — secrets
// set via the dashboard (like ANTHROPIC_API_KEY) must be declared here.
declare namespace Cloudflare {
  interface Env {
    ANTHROPIC_API_KEY: string;
  }
}
