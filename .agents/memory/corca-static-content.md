---
name: CORCA content availability and SEO
description: Preserve editable DC sources while publishing complete HTML and permanent redirects.
---
Keep the DC templates as the editable source, but serve generated, fully rendered HTML to visitors. Interactive runtime loading must never hide or delete that HTML until the replacement is ready.

**Why:** The client requested that stats, services, history, brands, values and contacts be available without JavaScript, including on slow mobile devices and to social crawlers. Preserve the existing design and carousel behavior rather than replacing the editing system.

**How to apply:** Regenerate snapshots after content changes, verify both JavaScript-disabled pages and activated interactions. Do not edit generated snapshots as the source of truth. Keep production routing consistent with preview: the previous catch-all rewrite to the homepage prevented distinct clean URLs; permanent legacy URL redirects require the lightweight production server.
