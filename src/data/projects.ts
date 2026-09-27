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
    title: "Real-estate lead automation",
    blurb:
      "A property enquiry form that instantly logs each lead to Google Sheets, emails the agent the details with a one-tap WhatsApp link, and auto-replies to the buyer promising a call within 30 minutes.",
    stack: ["n8n", "Webhooks", "Google Sheets", "Gmail"],
    image: "/projects/lead-generation.png",
    note: "Private workflow",
  },
  {
    slug: "meeting-transcript",
    title: "Meeting notes automation",
    blurb:
      "Upload a meeting's notes and attendee list — an LLM (Groq) summarises them, the summary is saved to a Notion database, and every attendee gets it by email automatically.",
    stack: ["n8n", "Groq LLM", "Notion API", "Gmail"],
    image: "/projects/meeting-transcript.png",
    note: "Private workflow",
  },
];

export const PLACEHOLDER_IMAGE = "/projects/placeholder.png";
