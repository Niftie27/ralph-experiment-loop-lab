---
type: note
name: YouTube Transcript Fallback Playbook
sources:
  - wiki/sources/youtube-ai-research-os-workshop-video.md
  - wiki/sources/ai-research-os-conventions.md
tags:
  - ralph
  - research-note
  - source-scan
related:
  - core/input-output-flow.md
  - core/ai-research-os-setup.md
  - decisions/unknowns.md
created: 2026-07-01T11:45:00Z
last_updated: 2026-07-01T11:50:00Z
---

# YouTube Transcript Fallback Playbook

RALPH should treat YouTube transcript extraction as a tiered pipeline, not a single dependency.

## Tested Against AI Research OS Video

Target: `https://www.youtube.com/watch?v=ZRM_TfEZcIo&t=1998s`

Observed:

- `youtube-transcript-api` via the installed AI Research OS script was callable, but YouTube returned `RequestBlocked`.
- `yt-dlp --list-subs` failed with YouTube sign-in/bot confirmation from this runtime.
- Invidious/Piped style public endpoints were inconsistent: one instance exposed caption metadata, but caption body retrieval was empty or blocked.
- The YouTube page HTML exposed description, chapters, links, summary, and a transcript panel.
- `whisper.cpp` is installed locally and works on audio files. It successfully transcribed the included JFK sample MP3/WAV with `ggml-base.bin`.
- Tomas supplied a full transcript from the Chrome extension `Youtube Transcript AI Summary`; RALPH ingested it as a manual transcript.

## Decision

Use a two-track strategy:

1. Prefer existing public captions when they are available without account/cookies.
2. When captions are blocked or missing, use browser transcript export or local audio/video transcription with Whisper.

Do not make browser cookies or logged-in YouTube sessions the default path. They can leak account cookies and may risk account restrictions. Use them only with explicit approval.

## Fallback Order

### Tier 1 - Official RALPH/AI Research OS Path

Use the installed workshop script:

```bash
uv run --script .claude/skills/research/scripts/youtube_extract_transcript.py \
  --url "https://www.youtube.com/watch?v=<id>" \
  --output-md ralph-research-os/raw/youtube-<slug>.md \
  --output-json /tmp/youtube-<slug>.json
```

Good when:

- captions are public
- YouTube does not block the runtime IP

Failure modes:

- cloud/provider IP blocked
- captions unavailable
- video region/age/account gated

### Tier 2 - `yt-dlp` Captions Probe

Use `yt-dlp` to list or write subtitles:

```bash
uvx yt-dlp --list-subs "https://www.youtube.com/watch?v=<id>"
uvx yt-dlp --skip-download --write-auto-subs --write-subs \
  --sub-langs "en.*,cs.*" --sub-format vtt \
  "https://www.youtube.com/watch?v=<id>"
```

Good when:

- `youtube-transcript-api` is blocked but yt-dlp can still access the video

Failure modes:

- YouTube bot/sign-in confirmation
- old yt-dlp extractor
- missing JavaScript runtime / player changes

### Tier 3 - Public Mirror Probe

Use Invidious/Piped style endpoints only as opportunistic fallback.

Good when:

- a public instance can fetch captions

Failure modes:

- anti-bot pages
- empty caption bodies
- stale instances
- rate limits
- unreliable availability

This should not be the canonical RALPH path.

### Tier 4 - User Transcript Export

If the transcript matters and public extraction fails, ask Tomas to export/paste the transcript from the browser UI.

Good when:

- the video has a visible transcript panel for a normal browser
- RALPH only needs semantic content, not exact video/audio

Store as:

- `raw/youtube-<slug>-manual-transcript.md`
- `transcript_source: manual`
- `wiki/sources/<slug>.md`

Validated path:

- Chrome extension used by Tomas: `Youtube Transcript AI Summary`
- RALPH handling: preserve the transcript in the raw source and mark `transcript_source: manual`

### Tier 5 - Local Audio/Video Transcription

If Tomas sends the video/audio file, or if a local machine can legitimately provide the media file, transcribe with local Whisper.

Installed local command:

```bash
/home/coder/.openclaw/tools/whisper.cpp/build/bin/whisper-cli \
  -m /home/coder/.openclaw/tools/whisper.cpp/models/ggml-base.bin \
  -f /path/to/audio-or-video-file.mp3 \
  -otxt -osrt -of /tmp/transcript-output
```

Good when:

- YouTube blocks cloud captions
- captions are missing
- Tomas can provide a local media file

Current local validation:

- `whisper-cli` exists.
- `ggml-base.bin` exists.
- MP3 and WAV decoding worked on the local JFK sample.

Limit:

- This requires audio/video bytes, not just a YouTube URL.
- There is no system `ffmpeg` binary in this runtime, although `whisper.cpp` can decode MP3/WAV directly and the workspace has `ffmpeg-static` under `.tmp-stt/node_modules/`.

### Tier 6 - Isolated Throwaway Account

Only consider this if YouTube ingest becomes frequent enough that manual transcript export is the bottleneck.

A throwaway account means a separate minimal Google/YouTube account used only for transcript fetching:

- not Tomas's main Google account
- no personal subscriptions, watch history, uploads, comments, or payments
- no password shared in chat
- read-only transcript/caption access only
- isolated browser profile or cookie jar
- credentials/cookies deleted after the test when possible

RALPH should not create this account for Tomas, store its credentials, or use it for likes, comments, uploads, subscriptions, or any account action. This remains a watch item, not the default workflow.

## RALPH Operating Rule

For YouTube/video source intake:

1. Try public transcript extraction.
2. If blocked, save metadata/description/chapters and record the blocker.
3. If transcript is required, request manual transcript export or local media upload.
4. Transcribe local media with Whisper.
5. Use an isolated throwaway account only after explicit approval and only if manual export becomes too costly.
6. Promote only the transcript or extracted notes that change RALPH memory.

> Synthesis: The robust no-paid solution is not "one magic YouTube endpoint." It is public captions when available, browser transcript export when the user can access it, local ASR when public captions are blocked, and isolated account access only as a last resort.
