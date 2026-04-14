---
name: Keep it simple, no over-abstraction
description: User strongly prefers simple, direct solutions over abstraction layers. His wife uses this system — it must be dead simple.
type: feedback
---

Do not add extra abstraction layers (like a master Google Sheet) when the data can be read directly from the source (Drive folders). The user's wife manages the content — every layer of indirection is a usability problem.

**Why:** The user called out the master-sheet-per-property approach as "way overabstracted and overengineered." An AI agent helps populate content, so the structure just needs to be simple and parseable, not optimized for developer ergonomics.

**How to apply:** Default to the simplest possible architecture. If Drive folders already contain the data, don't add a Sheet on top. Ask "could a non-technical person manage this?" before proposing a data model.
