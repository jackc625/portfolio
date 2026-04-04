import { describe, it } from "vitest";

describe("Prompt Injection Defense (S1, D-22)", () => {
  it.todo("does not pass raw user input as system instructions");
  it.todo("limits conversation history to prevent injection accumulation");
  it.todo("validates message content type is string");
});
