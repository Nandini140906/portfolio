export interface Project {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  /** Path under /public. Falls back to the placeholder if the file is missing. */
  image: string;
  /** Public link; leave empty for private work (then `note` is shown instead). */
  liveUrl?: string;
  repoUrl?: string;
  /** Small mono label shown when there's no public link, e.g. "Private workflow". */
  note?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "sunsky-jaipur",
    title: "Sunsky Jaipur",
    blurb: "Live website for Sunsky Jaipur.", // TODO: one line on what the site does / who it's for
    stack: ["Web design", "Development"], // TODO: real stack (e.g. React, Next.js, WordPress…)
    image: "/projects/sunsky.png", // TODO: replace with a real screenshot of the site
    liveUrl: "https://www.sunskyjaipur.com",
    featured: true,
  },
  {
    slug: "lead-generation",
    title: "Lead generation automation",
    blurb: "An automated workflow that finds and collects leads, so outreach starts with a ready-to-use list.", // TODO: refine
    stack: ["n8n", "Automation"], // TODO: confirm tools (APIs, sheets/CRM, LLM…)
    image: "/projects/lead-generation.png", // TODO: swap for a real workflow screenshot
    note: "Private workflow",
  },
  {
    slug: "meeting-transcript",
    title: "Meeting transcript automation",
    blurb: "Turns meeting recordings into clean, shareable transcripts — no manual note-taking.", // TODO: refine
    stack: ["n8n", "Speech-to-text"], // TODO: confirm tools
    image: "/projects/meeting-transcript.png", // TODO: swap for a real workflow screenshot
    note: "Private workflow",
  },
];

export const PLACEHOLDER_IMAGE = "/projects/placeholder.png";
