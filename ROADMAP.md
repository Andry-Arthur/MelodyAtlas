# MelodyAtlas roadmap

## Purpose

This document is the high-level product and engineering roadmap. Use it to align features, prioritize work, and onboard contributors. Review and update it after major releases, or at least quarterly, so it stays honest about what is shipped versus what is planned.

## Product vision

MelodyAtlas is a **personal musical geography**: your memories live on a world map, anchored in time and place. You explore your own atlas, visit friends’ maps, and share moments by tagging people on memories so those pins also appear on their map. The experience should feel calm, map-first, and about connection—not a generic social feed.

## Current baseline (shipped)

These capabilities exist in the codebase today:

- **Authentication** -- Email/password and OAuth providers (e.g. Google, Facebook, Spotify) via Supabase Auth.
- **Per-user maps** -- Each signed-in user sees their own memories on the home map; data is scoped to the owner plus pins they are tagged on.
- **Profiles** -- Public handle (`profile_id`), display name, avatar, bio, optional birthday; onboarding when birthday is missing; edit profile.
- **Friends** -- Friend requests, accept/decline, list and remove friends; search users by profile ID.
- **Friend maps** -- Visiting `/u/:profileId` opens that user’s map with full interaction (view pin details, music); add-friend from profile card when applicable.
- **Memories (pins)** -- Location, title, description, date, images (Supabase Storage), multi-platform music (Spotify + oEmbed-style links).
- **Tagging** -- Tag accepted friends on a new memory; tagged users see that pin on their map with a distinct visual style.
- **Search** -- Header search for your memories, people (profile ID), and Mapbox places; fly-to on selection.
- **Timeline** -- Date-range filter from birthday (or earliest pin) through today; animated scrubber.
- **Map UX** -- Clustering (Supercluster), optional friend-pins overlay on the main map, fly-to from search.
- **Quality** -- Vitest + Testing Library, ESLint, TypeScript in CI-style checks.

## Roadmap by horizon

Outcomes are listed without prescribing implementation. Order within a horizon is not a strict commitment.

### Near term (0–2 months)

- **Documentation** -- Keep README and env examples accurate for all migrations and OAuth redirect URLs.
- **Polish** -- Mobile and touch-friendly map interactions; clearer empty states when there are no pins or no friends.
- **Performance** -- Faster initial map feel; lazy loading for images and embeds where it helps.
- **Social UX** -- In-app or email-adjacent awareness of friend requests (today the Friends panel is the hub).
- **Memory editing** -- Edit pin metadata after creation; add or remove tagged friends without recreating the pin.
- **Accessibility** -- Keyboard paths for core flows, focus management in modals, contrast and motion preferences where feasible.

### Mid term (3–6 months)

- **Lightweight engagement** -- Optional comments or reactions on memories visible to owner and tagged friends (with clear privacy rules).
- **Discovery** -- Easier ways to find friends’ maps (e.g. from search, mutual friends, or shared tags) without turning into a global directory.
- **Sharing** -- Export or share a memory as an image, link, or Open Graph preview for messaging apps.
- **Privacy controls** -- Optional visibility toggles (e.g. profile or map discoverability) while keeping the default “friends and tagged” model understandable.
- **Trust and safety** -- Basic moderation hooks if user-generated content and social surface area grow (reporting, block list).

### Later / exploration

- **Native clients** -- iOS/Android shells or full apps if usage justifies the investment.
- **Offline and resilience** -- Cached regions or offline-first subsets of the map for travelers.
- **Music platform depth** -- Deeper Apple Music or other catalog integrations beyond current embed flows.
- **Collaborative layers** -- Shared playlists or collaborative pins tied to regions or events.
- **Creators** -- Lightweight analytics for people who want to understand how their shared map is viewed (privacy-preserving).

## How we use this roadmap

- Prefer **GitHub Issues** (and PRs) that reference a section here—for example, “Near term: Memory editing”—so discussion stays traceable.
- When a major feature ships, update **Current baseline** and move or strike items from the horizons as appropriate.
- Avoid treating this file as a substitute for issue tracking; it is the narrative layer on top of Issues and releases.

## Contributing

- Run tests: `npm test` (Vitest).
- Run lint: `npm run lint`.
- Propose larger changes by opening an Issue that points to the relevant **Roadmap by horizon** section; smaller fixes can go straight to a PR with a clear description.

For setup and environment variables, see [README.md](README.md).
