#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }

const sinceIdx = process.argv.indexOf("--since");
const since = sinceIdx !== -1 ? process.argv[sinceIdx + 1] : null;

const logCmd = since
  ? `git log ${since}..HEAD --oneline`
  : `git log -30 --oneline`;

const log = execSync(logCmd, { encoding: "utf8" }).trim();
if (!log) { console.error("No commits found."); process.exit(1); }

const today = new Date().toISOString().split("T")[0];
const client = new Anthropic({ apiKey: key });
const stream = client.messages.stream({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Generate a Keep a Changelog (keepachangelog.com) formatted entry for these commits. Use today's date: ${today}. Group into Added/Changed/Fixed/Removed sections as appropriate.\n\nCommits:\n${log}`
  }]
});

for await (const chunk of stream) {
  if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta")
    process.stdout.write(chunk.delta.text);
}
console.log();
