import { describe, it } from "vitest";

describe("Chat API Endpoint (D-09)", () => {
  it.todo("returns SSE content-type header for valid requests");
  it.todo("returns 400 for invalid JSON body");
  it.todo("returns 400 for missing messages field");
  it.todo("returns 413 for request body exceeding 32KB");
  it.todo("returns 429 when rate limited");
  it.todo("streams SSE events with data: prefix");
  it.todo("sends [DONE] event when stream completes");
  it.todo("sends error event on API failure");
  it.todo("sends error event on mid-stream connection failure");
});
