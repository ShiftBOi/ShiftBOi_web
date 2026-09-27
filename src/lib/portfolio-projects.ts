export type ProjectSection = {
  label: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ProjectBand = {
  id: string;
  title: string;
  body: string;
  media?: {
    type: "video" | "image";
    src: string;
    poster?: string;
  } | null;
};

export type PortfolioProject = {
  slug: string;
  title: string;
  summary: string;
  thesisLead: string;
  thesisHighlight: string;
  thesisRest: string;
  thesisBody: string;
  year: string;
  role: string;
  heroMetric: string;
  heroMetricLabel: string;
  heroTitle: string;
  heroBody: string;
  media?: {
    type: "video" | "image";
    src: string;
    poster?: string;
    colorSrc?: string;
    bwSrc?: string;
    objectPosition?: string;
  };
  /** Split media+copy boxes under the hero */
  bands?: ProjectBand[];
  /** Ordered detail blocks (preserves CMS drag order) */
  details?: import("@/lib/project-draft").DetailBlock[];
  /** Hover preview in “More projects” lists */
  introSrc?: string;
  titleIcon?: string;
  download?: {
    label: string;
    href: string;
  };
  highlights: Array<{
    metric: string;
    label: string;
    title: string;
    body: string;
  }>;
  sections: ProjectSection[];
  stack: string[];
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    slug: "vibesaur",
    title: "Vibesaur Extension",
    summary:
      "Raise a dinosaur from commit quality — not just how often you push. A local-only Cursor / VS Code pet with a living island, stats desk, and star store.",
    thesisLead: "Commit quality is",
    thesisHighlight: "not",
    thesisRest: "commit count.",
    thesisBody:
      "Vibesaur turns tidy diffs and clear messages into a living island pet — gamified discipline that stays 100% local, with no account and no cloud sync.",
    year: "2026",
    role: "Solo product · shipped extension",
    heroMetric: "2K+",
    heroMetricLabel: "USERS IN FIRST 48H",
    heroTitle: "A pet that grows from how you commit",
    heroBody:
      "Launched into the editor marketplace and crossed two thousand installs in the first two days. People didn't just try it — they kept the island open while they worked.",
    media: {
      type: "video",
      src: "/images/projects/vibesaur/vibesaur-demo.mov",
      poster: "/images/projects/vibesaur/hero_pic.png",
      colorSrc: "/images/projects/vibesaur/hero_vid.mov",
      bwSrc: "/images/projects/vibesaur/hero_vid.mov",
    },
    titleIcon: "/images/projects/vibesaur/icon.png",
    introSrc: "/images/projects/vibesaur/hero_pic.png",
    download: {
      label: "Download",
      href: "cursor:extension/vibesaur.vibesaur",
    },
    highlights: [
      {
        metric: "2K+",
        label: "DAY 1–2",
        title: "Fast adoption, zero onboarding friction",
        body: "Install, open Explorer, meet your dino. No signup wall — which is exactly why the first weekend felt loud.",
      },
      {
        metric: "Island",
        label: "LIVING HABITAT",
        title: "Walk, weather, hunts, and home",
        body: "An animated island in the sidebar — campfire, hut, slime hunts, and maps that react as your pet levels up.",
      },
      {
        metric: "Local",
        label: "PRIVACY FIRST",
        title: "Your git stays on your machine",
        body: "Vibesaur reads workspace git history only to score the pet. Nothing is uploaded. No account. No cloud pet server.",
      },
    ],
    sections: [
      {
        label: "The hook",
        title: "What if good commits felt as fun as a game?",
        paragraphs: [
          "Most developer tools lecture you about hygiene. Vibesaur does the opposite — it gives you a tiny dinosaur that only thrives when your commits are thoughtful.",
          "Bloated diffs and junk messages hurt the pet. Small, clear, conventional commits feed it. Suddenly “feat: …” isn’t a style guide — it’s dinner.",
          "That emotional loop is the product. Vibesaur isn’t a dashboard of guilt. It’s a creature you don’t want to disappoint.",
        ],
      },
      {
        label: "Why it exists",
        title: "Built to ship a real product people open every day",
        paragraphs: [
          "This wasn’t a weekend toy left in a private repo. Vibesaur was designed to live inside Cursor and VS Code — the place developers already spend hours — and to feel delightful the first time someone expands the Explorer panel.",
          "The early traction mattered: roughly 2,000 people came in within the first two days. That signal said the joke landed, the craft held up, and the install path was short enough that curiosity converted.",
          "For hiring and client work, Vibesaur is proof I can invent a sharp product idea, own the full build, polish the interaction design, and put it in front of strangers without a sales team.",
        ],
      },
      {
        label: "How it works",
        title: "A scoring loop that rewards craft",
        paragraphs: [
          "After you adopt a pet, only new commits in the open workspace count. Each scored commit moves hunger, health, and EXP. Diff size and message quality decide whether the dino feels fed or bruised.",
          "The rules are intentionally readable. Keep changes tight. Write a message a teammate could skim. Treat conventional prefixes as a free buff. The game never needs a tutorial video — the feedback is the tutorial.",
        ],
        bullets: [
          "Tidy diffs (small change sets) boost health; bloated dumps chip it",
          "Conventional / clear messages score higher than “wip” and “fix”",
          "Long gaps raise hunger; the island still has light chaos (weather, hunts) so the world feels alive between commits",
          "Leveling is steep on purpose — progress feels earned, not inflated",
        ],
      },
      {
        label: "Product surfaces",
        title: "More than a mascot in a panel",
        paragraphs: [
          "The island is the face of the product, but the rest of the loop keeps people returning: a Pet Desk for vitals and contribution graph, a Star Store for classes and habitat items, map choices, and ambient music that can keep playing when you leave the panel.",
          "Those extras matter because they turn a one-liner idea (“pet that eats commits”) into a small world with goals, unlocks, and personality — without ever leaving the editor.",
        ],
      },
      {
        label: "Engineering notes",
        title: "Extension craft, not just cute sprites",
        paragraphs: [
          "Vibesaur is a TypeScript VS Code / Cursor extension: Explorer webview for the living island, extension host logic for git watching and scoring, and a packaging path to marketplace distribution.",
          "The interesting constraint was making animation, state, and git feedback feel instant while staying local-only. That forced careful boundaries between host and webview, lean asset loading, and scoring rules that are deterministic enough to trust.",
          "I don’t publish internal implementation dumps here — the point for readers is the outcome: a shipped, playful product with measurable early demand and a privacy-respecting architecture.",
        ],
        bullets: [
          "VS Code Extension API + TypeScript + esbuild packaging",
          "Git-aware scoring from the open workspace only",
          "Canvas / sprite island UI inside a sidebar webview",
          "Marketplace install path with auto-update friendly releases",
        ],
      },
      {
        label: "What this shows",
        title: "Idea → polish → strangers using it",
        paragraphs: [
          "Vibesaur is the kind of project I want on a portfolio: opinionated, fun, technically real, and validated by people who didn’t owe me a click.",
          "If you’re hiring or commissioning product work, this is the energy I bring — playful concepts, serious shipping standards, and enough taste to make a tool feel alive.",
        ],
      },
    ],
    stack: ["TypeScript", "VS Code Extension API", "esbuild", "simple-git", "Canvas webview"],
  },
  {
    slug: "sknat",
    title: "SKNAT",
    summary:
      "Thai real-estate platform: smart search, maps, and compare for buyers — plus seller & admin tools for listings, leads, and sales in one stack.",
    thesisLead: "Finding a home should feel",
    thesisHighlight: "clear",
    thesisRest: "not fragmented.",
    thesisBody:
      "SKNAT unifies public discovery with seller and admin operations — search, map, compare, and back-office in one Next.js + MySQL system.",
    year: "2025",
    role: "Full-stack product build",
    heroMetric: "1",
    heroMetricLabel: "APP FOR BUYERS + OPS",
    heroTitle: "Browse, compare, and manage listings end to end",
    heroBody:
      "A single product surface for discovery and operations — so agents aren’t stuck in one tool while buyers live in another.",
    introSrc: "/images/projects/sknat/intro.png",
    highlights: [
      {
        metric: "Map",
        label: "DISCOVERY",
        title: "Search, map, favorites, compare",
        body: "Filters that match how people actually hunt homes — transit, district, bedrooms — plus side-by-side compare.",
      },
      {
        metric: "Roles",
        label: "ADMIN · SELLER",
        title: "Back-office in the same product",
        body: "Listings, media, location picking, and role-aware portals without bolting on a second codebase.",
      },
      {
        metric: "Stack",
        label: "NEXT + MYSQL",
        title: "Modern web ops foundation",
        body: "Next.js front-to-API with Dockerized MySQL — designed to be demable, deployable, and extendable.",
      },
    ],
    sections: [
      {
        label: "The product",
        title: "Real estate without the tool sprawl",
        paragraphs: [
          "SKNAT is a Thai real-estate platform built so buyers can explore properties with confidence while sellers and admins run the business from the same system.",
          "The public side feels like a polished marketplace: search, map browsing, favorites, and compare. The private side covers inventory, inquiries, and sales workflows — without forcing a separate legacy admin forever.",
        ],
      },
      {
        label: "Problem",
        title: "Discovery and operations usually divorce each other",
        paragraphs: [
          "Too many property products look great on the landing page and fall apart the moment an agent needs to update a listing or an admin needs to see what happened to a lead.",
          "SKNAT’s bet was simple: one coherent product loop. If the buyer experience and the ops experience share models and UI language, the whole company moves faster.",
        ],
      },
      {
        label: "What I built",
        title: "End-to-end product surfaces",
        paragraphs: [
          "I worked across the stack — from the public browsing experience to role-based portals and API routes that keep listings, members, and transactions honest.",
          "The interesting part wasn’t any single widget. It was making filters, maps, and compare feel premium while still wiring CRUD, media, and permissions that hold up past a demo.",
        ],
        bullets: [
          "Public property discovery with map and comparison flows",
          "Seller / admin tooling for listings and operations",
          "Auth and role separation for different operators",
          "Dockerized MySQL foundation for local and staged runs",
        ],
      },
      {
        label: "Engineering angle",
        title: "Full-stack ownership on a real domain",
        paragraphs: [
          "This project shows how I approach product engineering: start from user jobs (find a home, list a home, close a lead), then shape the data model and UI so those jobs don’t fight each other.",
          "Sensitive business data and private credentials stay out of this write-up. What belongs here is the craft — architecture choices, UX decisions, and the ability to ship a multi-role marketplace shape.",
        ],
      },
      {
        label: "Why it belongs here",
        title: "Client-ready product thinking",
        paragraphs: [
          "SKNAT is the kind of build clients and employers recognize: a domain people understand, a surface that looks intentional, and a backend story that isn’t hand-wavy.",
          "It demonstrates I can take a messy real-world workflow and turn it into something people can click through without apologizing for the admin side.",
        ],
      },
    ],
    stack: ["Next.js", "React", "TypeScript", "MySQL", "Docker", "Tailwind"],
  },
  {
    slug: "tastesiam",
    title: "Tastesiam",
    summary:
      "Discover Thai food heritage, communities, and local businesses on the map — with multilingual UX, bookings/commerce, and multi-role operator dashboards.",
    thesisLead: "Local Thai flavor should be",
    thesisHighlight: "findable",
    thesisRest: "not buried.",
    thesisBody:
      "Tastesiam connects travelers to communities, businesses, and heritage food — with operator tools for the people who run those places.",
    year: "2025",
    role: "Full-stack platform",
    heroMetric: "4+",
    heroMetricLabel: "LANGUAGES",
    heroTitle: "Tourism discovery with real operator tooling",
    heroBody:
      "A bilingual-capable (and beyond) platform where travelers explore — and communities / businesses actually manage what travelers see.",
    introSrc: "/images/projects/tastesiam/intro.png",
    highlights: [
      {
        metric: "Map",
        label: "DISCOVERY",
        title: "Places with a story",
        body: "Provinces, communities, businesses, hotels, and seasonal moments — searchable and map-aware.",
      },
      {
        metric: "Ops",
        label: "MULTI-ROLE",
        title: "Owners get a real console",
        body: "Dashboards for community and business operators, plus admin curation — not a fake CMS screenshot.",
      },
      {
        metric: "API",
        label: "MODERN BACKEND",
        title: "Auth, media, and catalog",
        body: "A Bun-friendly API layer with auth flows, structured content, and room for commerce / review features.",
      },
    ],
    sections: [
      {
        label: "The idea",
        title: "Thailand’s local food culture, as a product",
        paragraphs: [
          "Tastesiam is a tourism and heritage-food discovery platform. Travelers explore communities and local businesses; operators get tools to present themselves properly instead of disappearing into generic directories.",
          "The fun part of the product is cultural: festivals, regional flavor, place storytelling. The serious part is operational: roles, approvals, listings, and multilingual UX.",
        ],
      },
      {
        label: "Audience",
        title: "Two sides of the same marketplace",
        paragraphs: [
          "Travelers need trust and orientation — maps, language, and detail pages that feel curated.",
          "Community owners, business owners, and managers need a console that doesn’t feel like punishment. If the operator UX fails, the public catalog dies of neglect.",
        ],
      },
      {
        label: "What makes it interesting as engineering",
        title: "Content, roles, and languages in one loop",
        paragraphs: [
          "Platforms like this fail when they treat “content” as static pages. Tastesiam leans into structured entities — communities, businesses, hotels, goods — and permissions around who can change what.",
          "Multilingual routing and copy aren’t a checkbox either. They’re part of the product promise for international travelers browsing Thai places.",
        ],
        bullets: [
          "Public discovery with map-centric browsing",
          "Role-based management portals",
          "Auth patterns suitable for consumers and operators",
          "API + web monorepo workflow for fast iteration",
        ],
      },
      {
        label: "Portfolio angle",
        title: "Taste + systems thinking",
        paragraphs: [
          "I like this project because it balances brand-feeling frontend work with the unglamorous backbone that makes a marketplace real.",
          "It’s also a clean conversation piece for clients: “we need discovery + owner tools + languages” is a sentence almost every tourism product eventually says out loud.",
        ],
      },
    ],
    stack: ["React", "Vite", "Elysia", "Prisma", "MySQL", "Bun", "i18next"],
  },
  {
    slug: "worldgate",
    title: "Worldgate",
    summary:
      "Marketing site + invite-only CMS for a Thailand freight forwarder — public brand pages powered by a content API the team can edit.",
    thesisLead: "A freight brand should stay",
    thesisHighlight: "editable",
    thesisRest: "not frozen in code.",
    thesisBody:
      "Worldgate pairs a precise public marketing site with an invite-only CMS and content API — so the team can update the homepage without turning every line of copy into an engineering ticket.",
    year: "2025",
    role: "Full-stack · marketing site + CMS",
    heroMetric: "2",
    heroMetricLabel: "SURFACES · WEB + CMS",
    heroTitle: "Logistics brand site with a real content pipeline",
    heroBody:
      "Public pages that feel operational and premium — backed by a CMS so services, stories, and media can change as the business moves.",
    media: {
      type: "image",
      src: "/images/projects/worldgate/hero.webp",
      poster: "/images/projects/worldgate/intro.jpg",
    },
    introSrc: "/images/projects/worldgate/intro.jpg",
    titleIcon: "/images/projects/worldgate/icon.png",
    bands: [
      {
        id: "wg-b1",
        title: "Public site",
        body: "Hero, about, services, and proof sections composed as a logistics-forward brand page — editable through the CMS instead of buried in components.",
        media: {
          type: "image",
          src: "/images/projects/worldgate/band-public.webp",
        },
      },
      {
        id: "wg-b2",
        title: "Operator CMS",
        body: "Invite-only console for homepage sections, services, media, and settings — so the team can ship content updates without a full redeploy ritual.",
        media: {
          type: "image",
          src: "/images/projects/worldgate/band-cms.webp",
        },
      },
    ],
    highlights: [
      {
        metric: "2",
        label: "SURFACES",
        title: "Marketing site + operator CMS",
        body: "A public brand experience for freight trust, paired with an invite-only CMS so the team can update homepage content without a deploy.",
      },
      {
        metric: "API",
        label: "SEPARATE BACKEND",
        title: "Content API for live homepage",
        body: "Homepage sections load from a CMS API — so marketing can iterate copy, media, and services while the front stays fast and typed.",
      },
      {
        metric: "UI",
        label: "OPS LANGUAGE",
        title: "Precision without looking cold",
        body: "Hairline rules, mono labels, navy + single accent — a logistics visual system that still feels modern on web and in the console.",
      },
    ],
    sections: [
      {
        label: "The product",
        title: "A freight brand that can actually be edited",
        paragraphs: [
          "Worldgate is a Thailand-based freight and logistics company site — public marketing on one side, and a content CMS on the other so the team can keep the homepage honest as services and stories change.",
          "The build split the surfaces intentionally: a Next.js marketing front with a strong operational design language, and a Bun API + CMS for authentication, homepage sections, media, and services.",
        ],
      },
      {
        label: "Problem",
        title: "Logistics sites go stale the moment marketing needs a change",
        paragraphs: [
          "Freight companies sell trust. When the homepage is hard-coded, every copy tweak becomes an engineering ticket — and the brand starts lagging behind real operations.",
          "Worldgate needed a public face that feels precise and premium, plus an operator path to update content without leaking credentials into a shared Google Doc forever.",
        ],
      },
      {
        label: "What I built",
        title: "End-to-end product surfaces",
        paragraphs: [
          "I worked across the marketing experience and the CMS/API loop — from hero and section composition to invite-only access, content modules, and media handling.",
          "The interesting craft was keeping the public site’s visual system (tight grid, hairlines, navy, restrained accent) consistent while the CMS stayed fast to operate.",
        ],
        bullets: [
          "Public marketing site with sectioned homepage composition",
          "Invite-only CMS for homepage, services, media, and settings",
          "Separate Bun API for content, auth, and media workflows",
          "Design system tokens shared across light/dark operational chrome",
        ],
      },
      {
        label: "Boundaries",
        title: "What’s public vs what stays private",
        paragraphs: [
          "This case study talks about product shape and engineering craft — not shipment ledgers, customer contracts, warehouse inventories, or internal credentials.",
          "Live ops data, private API keys, and staff accounts belong in the company’s systems. The portfolio shows the interface work: brand, CMS, and how content reaches the site.",
        ],
      },
      {
        label: "Why it belongs here",
        title: "Brand systems with an operator path",
        paragraphs: [
          "Worldgate shows I can ship a serious B2B brand surface and the tooling that keeps it alive — not just a static landing page that looks good in a screenshot.",
          "It’s the kind of build clients recognize: clear domain, intentional UI language, and a content pipeline that doesn’t collapse the week after launch.",
        ],
      },
    ],
    stack: ["Next.js", "React", "TypeScript", "Bun", "Elysia", "Prisma", "MySQL", "Tailwind"],
  },
  {
    slug: "seenpi",
    title: "Seenpi",
    summary:
      "Turn CCTV into a curated video wall — contributors publish feeds, staff compose layouts, Android TVs show multi-cam walls with weather, social, and ads.",
    thesisLead: "Live cameras should become a",
    thesisHighlight: "wall",
    thesisRest: "not a mess of players.",
    thesisBody:
      "Seenpi takes contributed feeds through moderation into composed Android TV layouts with fast WebRTC preview.",
    year: "2026",
    role: "Platform · CMS · TV client",
    heroMetric: "4",
    heroMetricLabel: "CAMERA SLOTS",
    heroTitle: "From submitted feed to paired TV wall",
    heroBody:
      "A full path from camera submission to moderated layouts on Android TV — built for lobbies, ops rooms, and curated public walls.",
    highlights: [
      {
        metric: "CMS",
        label: "MODERATE",
        title: "Human gate before the wall",
        body: "Staff review feeds, compose layouts, and pair displays — so the TV never becomes a free-for-all.",
      },
      {
        metric: "Live",
        label: "LOW LATENCY",
        title: "Preview you can trust",
        body: "WebRTC-style playback for monitoring — because a wall that lags isn’t a wall, it’s a slideshow.",
      },
      {
        metric: "TV",
        label: "ANDROID",
        title: "Dedicated display client",
        body: "Pairing codes, assigned layouts, and a TV-first experience for multi-cam compositions.",
      },
    ],
    sections: [
      {
        label: "The product",
        title: "CCTV as a curated experience",
        paragraphs: [
          "Seenpi is a live-camera platform for turning scattered feeds into something presentable: moderated, composed, and pushed to Android TV walls with room for widgets like weather, social, and ads.",
          "Think less “a pile of random live links” and more “one intentional display that a venue can actually run.”",
        ],
      },
      {
        label: "The loop",
        title: "Publish → moderate → compose → display",
        paragraphs: [
          "Camera owners submit feeds. Staff decide what is allowed. Layouts assemble up to multiple camera slots plus supporting widgets. Displays pair into the system and receive what they’re assigned.",
          "That loop is the whole product thesis. Without moderation and pairing, live video becomes chaos. Without a TV client, the CMS is just a gallery.",
        ],
        bullets: [
          "Role-aware CMS for contributors and staff",
          "Layout builder for multi-cam walls",
          "Display pairing and assignment",
          "Streaming path designed for preview + playback",
        ],
      },
      {
        label: "Engineering story",
        title: "Many moving parts, one clear job",
        paragraphs: [
          "This kind of system spans API, CMS, media plumbing, and a TV client. The portfolio-relevant skill is keeping those pieces aligned around one user promise: a wall that feels curated and responsive.",
          "I keep operational secrets and private stream credentials out of public write-ups. What matters here is the architecture of roles, layouts, and low-latency viewing.",
        ],
      },
      {
        label: "Why hire from this",
        title: "Systems that look good on a screen and hold up in ops",
        paragraphs: [
          "Seenpi shows I can work across web and device surfaces, think about permissions, and design for real-time media without reducing everything to a toy demo.",
          "It’s also a fun brief — people instantly understand “video wall” — which makes it a strong portfolio conversation starter.",
        ],
      },
    ],
    stack: ["Bun", "Elysia", "Postgres", "React", "Kotlin", "WebRTC"],
  },
  {
    slug: "dji-drone",
    title: "DJI Field Pin",
    summary:
      "Android DJI app that pins a ground location from live video and sends coordinates to a main coordination system — built to help people get found faster.",
    thesisLead: "A helpful location should be",
    thesisHighlight: "one tap",
    thesisRest: "away from the people who need it.",
    thesisBody:
      "DJI Field Pin turns a live drone camera into a precise ground pin — then forwards that point to a main ops system so responders can move toward people who need help.",
    year: "2025",
    role: "Android · DJI Mobile SDK",
    heroMetric: "1",
    heroMetricLabel: "TAP → PIN → SEND",
    heroTitle: "Mark a place from the sky, share it to the ground team",
    heroBody:
      "Connect a DJI aircraft, watch the live feed, tap the point that matters, and send clean coordinates to the main system coordinating help.",
    media: {
      type: "image",
      src: "/images/projects/dji-drone/hero.png",
      poster: "/images/projects/dji-drone/intro.jpg",
    },
    introSrc: "/images/projects/dji-drone/intro.jpg",
    highlights: [
      {
        metric: "Tap",
        label: "LIVE VIDEO",
        title: "Pin from the camera, not a guess",
        body: "Double-tap the live feed to mark the ground point under the view — so the pin matches what the operator actually sees.",
      },
      {
        metric: "Send",
        label: "TO MAIN SYSTEM",
        title: "Coordinates that leave the aircraft",
        body: "Once confirmed, the location is forwarded to a separate coordination host — the people organizing help get a shared point, not a screenshot in a chat.",
      },
      {
        metric: "Map",
        label: "CONTEXT",
        title: "See the pin in place",
        body: "Map context sits beside the feed so the team can sanity-check the mark before it becomes someone else’s walking direction.",
      },
    ],
    sections: [
      {
        label: "The product",
        title: "Drone vision that ends in a shared location",
        paragraphs: [
          "When someone needs help, the hard part is often not flying — it’s turning what the camera sees into a location the ground team can trust.",
          "DJI Field Pin is an Android app on DJI Mobile SDK V5: live video and telemetry from the aircraft, a tap-to-pin gesture on the feed, and a send path into a main coordination system.",
        ],
      },
      {
        label: "Why it exists",
        title: "Help people get found without losing the point",
        paragraphs: [
          "Verbal directions from the air break down. Screenshots lose precision. A dedicated pin → send loop keeps the mark structured so the main system can place it on a map and move people toward it.",
          "The public story stays about locating and assisting — not about any closed or restricted domain. The portfolio shows the product shape: camera, pin, coordinate, handoff.",
        ],
      },
      {
        label: "What I built",
        title: "Aircraft UI plus a clean handoff",
        paragraphs: [
          "I worked on the Android surface around DJI’s MSDK V5 stack: registration, live preview, map context, and the operator flow that confirms a pin before sending.",
          "The interesting craft is keeping geolocation honest — attitude, GPS, and terrain context — while the UI stays calm enough to use under time pressure.",
        ],
        bullets: [
          "Android app on DJI Mobile SDK V5 (consumer aircraft compatible)",
          "Live video with tap-to-mark ground position",
          "Map context for confirming the pin",
          "Send path to a separate main coordination system",
        ],
      },
      {
        label: "Boundaries",
        title: "What this write-up includes",
        paragraphs: [
          "This case study covers the operator UX and engineering shape — camera, pin, coordinate handoff — without publishing private keys, host internals, or restricted operational details.",
          "The intent on the portfolio is clear: a drone tool for pointing a place so people can be helped faster.",
        ],
      },
      {
        label: "Why it belongs here",
        title: "Hardware-adjacent product craft",
        paragraphs: [
          "DJI Field Pin shows I can ship past web dashboards into device SDKs — live media, maps, and a real send loop that another system can trust.",
          "It’s also a crisp product sentence: tap what you see, send where it is, help someone get there.",
        ],
      },
    ],
    stack: ["Kotlin", "Android", "DJI Mobile SDK V5", "OpenStreetMap", "Socket.IO"],
  },
  {
    slug: "artillery-fdc",
    title: "Artillery-FDC",
    summary:
      "Howitzer Fire Direction Center for web and desktop — map, firing tables, and mission workflows in one ops-minded surface.",
    thesisLead: "Fire direction should be",
    thesisHighlight: "one system",
    thesisRest: "not scattered worksheets.",
    thesisBody:
      "Artillery-FDC is a map-centric FDC app for computing and refining firing solutions in a single web/desktop workspace.",
    year: "2026",
    role: "Desktop + web product",
    heroMetric: "FDC",
    heroMetricLabel: "WEB + ELECTRON",
    heroTitle: "Map, math, and mission flow together",
    heroBody:
      "A cross-platform Fire Direction Center experience: place elements on a map, work through solution workflows, and keep the session coherent.",
    highlights: [
      {
        metric: "Map",
        label: "OPS UI",
        title: "Spatial first, always",
        body: "Elements live on a terrain-aware map — because fire direction is a geometry problem before it’s a form problem.",
      },
      {
        metric: "Tables",
        label: "DATA-DRIVEN",
        title: "Solutions from structured tables",
        body: "Firing data is modeled for lookup and computation inside the app — replacing fragile spreadsheet hopping.",
      },
      {
        metric: "App",
        label: "ELECTRON",
        title: "Field-friendly packaging",
        body: "Web for fast iteration, desktop shell when you need an installable ops surface.",
      },
    ],
    sections: [
      {
        label: "What it is",
        title: "A Fire Direction Center as software",
        paragraphs: [
          "Artillery-FDC is an application for howitzer fire direction workflows: map context, structured firing data, and mission-oriented screens that keep a solution session together.",
          "It’s built as both a web app and an Electron desktop build so the same product can be demoed quickly or packaged for offline-friendly use.",
        ],
      },
      {
        label: "Design intent",
        title: "Make the hard workflow feel navigable",
        paragraphs: [
          "Traditional FDC work can feel like juggling maps, tables, and notes. The product goal was to put the spatial view and the calculation flow in one coherent interface.",
          "The interesting UX challenge is density: operators need precision, but the UI still has to stay readable under pressure.",
        ],
      },
      {
        label: "Engineering (public level)",
        title: "Serious desktop craft, careful disclosure",
        paragraphs: [
          "Under the hood this is a modern TypeScript app: React UI, map rendering, local data for firing tables, and a desktop shell when needed.",
          "I’m intentionally not publishing sensitive operational details, proprietary table contents, or anything that reads like an ops manual. This portfolio page focuses on product shape and engineering maturity — not leaked internals.",
        ],
        bullets: [
          "React + TypeScript application architecture",
          "Map-centric interaction model",
          "Local structured data for solution workflows",
          "Electron packaging alongside web development",
        ],
      },
      {
        label: "Why it matters here",
        title: "Complex domain, calm interface",
        paragraphs: [
          "Artillery-FDC shows I can enter a dense domain, respect its constraints, and still ship an interface that feels intentional.",
          "For employers and clients, it’s evidence of discipline: ambitious systems work without turning a public portfolio into a dump of confidential material.",
        ],
      },
    ],
    stack: ["React", "TypeScript", "Electron", "Vite", "MapLibre", "Bun"],
  },
];

export function getPortfolioProject(slug: string) {
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug) ?? null;
}

/** @deprecated Prefer getPortfolioSlugsFromDb from @/lib/content for live data */
export function getPortfolioSlugs() {
  return PORTFOLIO_PROJECTS.map((p) => p.slug);
}
