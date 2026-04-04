// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/scripts/chat";

describe("Markdown Rendering + XSS Sanitization (D-21, D-25)", () => {
  it("renders bold markdown to strong tags", () => {
    const result = renderMarkdown("**bold**");
    expect(result).toContain("<strong>bold</strong>");
  });

  it("strips script tags from output", () => {
    const result = renderMarkdown("<script>alert(1)</script>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });

  it("strips img tags from output", () => {
    const result = renderMarkdown("![img](evil.jpg)");
    expect(result).not.toContain("<img");
  });

  it("allows only whitelisted HTML tags (strips div)", () => {
    const result = renderMarkdown("<div>html</div>");
    expect(result).not.toContain("<div>");
    expect(result).toContain("html");
  });

  it("renders unordered lists from markdown", () => {
    const result = renderMarkdown("- item1\n- item2");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
  });

  it("renders ordered lists (ol) from markdown", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>");
  });

  it("adds rel=noopener noreferrer to links", () => {
    const result = renderMarkdown("[link](https://example.com)");
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("adds target=_blank to links", () => {
    const result = renderMarkdown("[link](https://example.com)");
    expect(result).toContain('target="_blank"');
  });

  it("strips javascript: protocol from links", () => {
    const result = renderMarkdown("[click](javascript:alert(1))");
    expect(result).not.toContain("javascript:");
  });

  it("strips data: protocol from links", () => {
    const result = renderMarkdown("[link](data:text/html,<script>)");
    expect(result).not.toContain("data:");
  });

  it("forbids style attributes on all elements", () => {
    const result = renderMarkdown('<p style="color:red">text</p>');
    expect(result).not.toContain("style=");
    expect(result).toContain("text");
  });

  it("returns a string, not a Promise (async:false verification)", () => {
    const result = renderMarkdown("hello");
    expect(typeof result).toBe("string");
    // If marked returns a Promise, this would fail because typeof Promise is 'object'
    expect(result).not.toBeInstanceOf(Promise);
  });
});
