import { describe, it } from "vitest";

describe("Markdown Rendering + XSS Sanitization (D-21, D-25)", () => {
  it.todo("renders bold markdown to strong tags");
  it.todo("strips script tags from output");
  it.todo("strips img tags from output");
  it.todo("allows only whitelisted HTML tags");
  it.todo("renders ordered lists (ol) from markdown");
  it.todo("adds rel=noopener noreferrer to links");
  it.todo("adds target=_blank to links");
  it.todo("strips javascript: protocol from links");
  it.todo("forbids style attributes on all elements");
});
