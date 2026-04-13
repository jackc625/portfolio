---
status: diagnosed
phase: 10-page-port
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md, 10-05-SUMMARY.md, 10-06-SUMMARY.md, 10-07-SUMMARY.md]
started: 2026-04-13T16:00:00Z
updated: 2026-04-13T16:18:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Homepage Hero Display
expected: Homepage shows large JACK CUTRARA wordmark with an accent-red trailing dot. Below/beside it: an AVAILABLE FOR WORK status indicator with a green dot, and EST. 2024 metadata. Desktop uses wide grid layout, mobile collapses to single column.
result: pass

### 2. Homepage Featured Work Rows
expected: Below the hero, 3 featured project rows appear (SeatWatch, NFL Prediction, SolSniper) as numbered WorkRows with project name, tech stack (uppercased, middot-joined), and year. Each row links to its project detail page.
result: pass

### 3. Homepage About Preview
expected: An about section shows introductory text and one paragraph of bio copy, with a READ MORE link that navigates to the /about page.
result: pass

### 4. Homepage Contact Section
expected: A contact section at the bottom of the homepage with a GET IN TOUCH label, email link, social links (GitHub, LinkedIn — no X/Twitter), and a resume download link. The resume link triggers a file download (has download attribute).
result: pass

### 5. About Page Content
expected: /about page displays an intro line at a larger/heavier weight, followed by 3 body paragraphs of editorial copy. No icons, progress bars, or graphics — pure text. Smart typography (em dashes, curly quotes) renders correctly.
result: pass

### 6. Contact Page
expected: /contact page shows a SectionHeader with CONTACT title and a number (01). Below it, the same contact info as the homepage section: email, GitHub, LinkedIn (no X), resume download.
result: pass

### 7. Projects Index Page
expected: /projects page shows all 6 projects as numbered WorkRows (01–06) with a SectionHeader showing the count. Each row displays project name, tech stack, and year. Rows are sorted by a consistent order.
result: pass

### 8. Project Detail Case Study
expected: Clicking a project from the index opens an editorial case study page with: mono metadata header (YEAR + TECH STACK), large title, lead tagline, conditional external links (GITHUB/LIVE DEMO with arrows — only shown if URLs exist), and the MDX body content below with styled headings (section-sign labels on h2s).
result: pass

### 9. Project Detail NextProject Navigation
expected: At the bottom of each project detail page, a NextProject component links to the next project in order. On the last project, it wraps around to the first project.
result: pass

### 10. Footer Social Links
expected: Site footer displays social links for GITHUB, LINKEDIN, and EMAIL. No X/Twitter link present. Links open in new tabs (external links) or trigger mailto (email).
result: issue
reported: "No social links in footer on desktop"
severity: major

### 11. Chat Widget Editorial Style
expected: Clicking the chat bubble opens a panel with flat-rectangle chrome (sharp corners, no shadows, 1px rule border). Header reads ASK JACK'S AI in mono label style. The chat bubble trigger is the only round element. Starter chips appear as flat editorial buttons. On mobile, the panel goes full-screen.
result: issue
reported: "User's message bubble is rounded."
severity: cosmetic

### 12. Chat Message Send & Stream
expected: Typing a message and sending it shows the user message in the chat. A bot response streams in progressively (SSE). Typing dots animate with a bounce effect while waiting for the response to start.
result: issue
reported: "Two issues. Typing dots do not animate with a bounce effect. Also, a new sent message is sending above the historical past questions already in the chat — you have to scroll above old messages to see the one you just sent."
severity: major

### 13. Chat Copy Button
expected: After a bot message finishes streaming, a COPY button appears (text label, not an icon). Clicking it copies the message text and the button changes to COPIED briefly.
result: pass

### 14. Chat Message Persistence
expected: After sending at least one message, navigate to another page (e.g., /about) and then come back to the homepage. Open the chat panel — previous messages are still there. Close and reopen the panel — no duplicate messages appear. Hard refresh (Ctrl+Shift+R) — messages still persist. Privacy note at the bottom reads "Conversations stored locally for 24h."
result: pass

## Summary

total: 14
passed: 11
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Site footer displays social links for GITHUB, LINKEDIN, and EMAIL. No X/Twitter link present."
  status: failed
  reason: "User reported: No social links in footer on desktop"
  severity: major
  test: 10
  root_cause: ".footer-social has unconditional display:none on desktop (Footer.astro lines 82-85). Only visible at max-width:767px. Comment says 'contact section presents them' but user expects them in footer too."
  artifacts:
    - path: "src/components/primitives/Footer.astro"
      issue: ".footer-social display:none hides social links on desktop"
  missing:
    - "Remove or conditionalize the display:none rule so footer social links show on desktop"
  debug_session: ""

- truth: "Chat panel uses flat-rectangle chrome — only the trigger bubble is round"
  status: failed
  reason: "User reported: User's message bubble is rounded."
  severity: cosmetic
  test: 11
  root_cause: "chat.ts line 254 and 545 apply inline border-radius: 12px 12px 4px 12px to user message bubbles, overriding the editorial flat-rectangle design."
  artifacts:
    - path: "src/scripts/chat.ts"
      issue: "Inline border-radius on user message bubbles at lines 254 and 545"
  missing:
    - "Change border-radius to 0 in both createUserMessageEl() and history replay code"
  debug_session: ""

- truth: "New messages appear at bottom of chat, typing dots animate with bounce effect"
  status: failed
  reason: "User reported: Typing dots do not animate with a bounce effect. New sent message appears above historical past questions — have to scroll up to see it."
  severity: major
  test: 12
  root_cause: "Two root causes: (1) sendMessage() uses insertBefore($typingIndicator) at lines 756/794 — when history is loaded, new messages go above history instead of below. (2) startTypingDots() at line 441-448 explicitly sets style.animation='none' on each dot, overriding the CSS typing-bounce keyframes."
  artifacts:
    - path: "src/scripts/chat.ts"
      issue: "insertBefore($typingIndicator) places new messages above history"
    - path: "src/scripts/chat.ts"
      issue: "startTypingDots() disables animation with style.animation='none'"
  missing:
    - "Fix message insertion to append after history, not before typing indicator"
    - "Remove style.animation='none' from startTypingDots() so CSS keyframes work"
  debug_session: ""
