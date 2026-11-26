# Security Summary

**Reviewed Files**: 34
**Issues Resolved**: 4

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| HTML Sanitization Fallback | `lib/sanitize.ts` | 43 | `sanitizeEditorHtml` returned raw HTML unmodified when `window` was undefined during server evaluation, and pasted `target="_blank"` anchors did not enforce `rel="noopener noreferrer"`. | High | Fixed | Added a strict server fallback sanitizer stripping active tags, inline event handlers, and unsafe URI schemes, plus a DOMPurify hook enforcing `rel="noopener noreferrer"` on external links. |
| Image Upload & URI Validation | `lib/image-module.ts` | 6 | `processLocalImageFile` accepted `image/svg+xml` via `image/*`, and `buildImageFigureHtml` interpolated `dataUrl` without checking the URI format. | Medium | Fixed | Restricted image uploads to raster formats (`png`, `jpeg`, `webp`, `gif`, `avif`) and validated `src` URIs inside `buildImageFigureHtml` before building figure HTML. |
| API Payload Bounds & JSON Guard | `app/api/gemini/route.ts` | 26 | Unbounded message arrays and malformed JSON bodies were not guarded before calling the model SDK. | Medium | Fixed | Added `try/catch` returning HTTP `400` on invalid JSON and enforced message count (`30`) and character limits (`96,000` chars). |
| Frontmatter Escaping & Clipboard Fallback | `lib/export-utils.ts` | 397 | `tone` in YAML frontmatter lacked quote escaping, and `navigator.clipboard.writeText` rejection skipped the fallback copy handler. | Low | Fixed | Escaped quotes on frontmatter `tone` and caught Clipboard API errors so the fallback `textarea` copy path runs cleanly. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| API Keys & Secrets | `app/api/gemini/route.ts` | Built-in Gemini API key is read strictly from server-side `process.env.GEMINI_API_KEY` and never exposed to browser bundles. |
| URL Auto-Linking | `lib/blog-editor.ts` | `normalizeSafeHttpUrl` parses candidate URLs with `new URL(...)`, allows only `http:` and `https:`, and sets `rel="noopener noreferrer"`. |
| Rich Text & Export Rendering | `components/ReaderModal.tsx`, `lib/export-utils.ts` | Rendered HTML and exported HTML/PDF documents sanitize editor body HTML through `sanitizeEditorHtml` and escape headlines with `escapeHtmlText`. |
| Build & Vercel Compatibility | `next.config.ts`, `app/not-found.tsx` | Native App Router `not-found.tsx` avoids legacy Pages Router `/404` prerender failures, and `output: 'standalone'` is disabled when `process.env.VERCEL` is set. |

## PoC Verification

### Unsanitized Non-DOM HTML & Missing Link `rel` Protection
#### Summary
| Field | Value |
|---|---|
| Issue Type | Incomplete Server Sanitization & External Link Attributes |
| Impact | High |
| Affected File | `lib/sanitize.ts:43` |
| Test Scenario | `<p>Hello</p><script>alert(1)</script><a href="https://example.com" target="_blank" onclick="alert(1)">Link</a>` |

#### How It Was Fixed
Added `sanitizeServerFallback` when `typeof window === 'undefined'` to strip dangerous tags, `on*` event attributes, and non-HTTP/raster-data URIs, and registered a DOMPurify `afterSanitizeAttributes` hook forcing `rel="noopener noreferrer"` on `target="_blank"` anchors.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Test HTML enters `sanitizeEditorHtml(html)` in `lib/sanitize.ts` | Input enters sanitizer |
| 2 | In SSR (`typeof window === 'undefined'`), `sanitizeServerFallback` strips `<script>` and `onclick=...`; in browser, DOMPurify strips `<script>` and `onclick`, and `afterSanitizeAttributes` sets `rel="noopener noreferrer"` | Script and event attributes removed; `rel` enforced |
| 3 | Clean HTML returned to caller | **Handled Safely** |

#### Conclusion
**Fix Verified** - Neither server-evaluated sanitization nor browser DOMPurify passes can retain `<script>` blocks, inline event handlers, or unprotected `target="_blank"` anchors.

### SVG Image Upload & Unvalidated `src` Interpolation
#### Summary
| Field | Value |
|---|---|
| Issue Type | Permissive Image MIME Check & Unvalidated `src` Attribute |
| Impact | Medium |
| Affected File | `lib/image-module.ts:13` |
| Test Scenario | Uploading a crafted `payload.svg` (`image/svg+xml`) or calling `buildImageFigureHtml('javascript:alert(1)', 'x')` |

#### How It Was Fixed
Replaced `file.type.startsWith('image/')` with an explicit allowlist of raster MIME types (`ALLOWED_RASTER_TYPES`) and added `SAFE_IMAGE_SRC_RE` validation inside `buildImageFigureHtml`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Crafted `image/svg+xml` file enters `processLocalImageFile(file)` | Checked against `ALLOWED_RASTER_TYPES` |
| 2 | `ALLOWED_RASTER_TYPES.has('image/svg+xml')` evaluates to `false` | Throws validation error immediately |
| 3 | Direct call to `buildImageFigureHtml('javascript:alert(1)', 'x')` fails `SAFE_IMAGE_SRC_RE.test(...)` | Throws unsupported format error |

#### Conclusion
**Fix Verified** - Only validated raster images (`png`, `jpeg`, `webp`, `gif`, `avif`) and safe `https://` or base64 raster data URLs can enter editor figures.

### Malformed JSON & Oversized Payload on `/api/gemini`
#### Summary
| Field | Value |
|---|---|
| Issue Type | Unbounded Request Payload & Unhandled JSON Parse |
| Impact | Medium |
| Affected File | `app/api/gemini/route.ts:26` |
| Test Scenario | `POST /api/gemini` with invalid JSON body or `messages` array exceeding 30 items / 96,000 characters |

#### How It Was Fixed
Wrapped `req.json()` in a `try/catch` returning HTTP `400`, sliced `messages` to `MAX_MESSAGES` (`30`), truncated `systemInstruction`, and rejected total message payloads above `96,000` characters with HTTP `400`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Malformed JSON arrives at `POST` in `app/api/gemini/route.ts` | `req.json()` throws inside `try/catch` -> HTTP `400` returned |
| 2 | Oversized `messages` payload arrives | `totalChars > MAX_TEXT_CHARS * 2` triggers HTTP `400` before `GoogleGenAI` call |

#### Conclusion
**Fix Verified** - Invalid JSON and oversized prompts are rejected cleanly with `400` responses before reaching the model SDK.
