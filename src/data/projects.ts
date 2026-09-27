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
  /** Used if `image` fails to load (e.g. a remote screenshot service is down). */
  fallbackImage?: string;
  /** Step-by-step "How it works" pictures, shown in order in a gallery. */
  gallery?: { src: string; caption: string }[];
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "sunsky-jaipur",
    title: "Sunsky Jaipur",
    blurb: "Live website for Sunsky Jaipur.", // TODO: one line on what the site does / who it's for
    stack: ["Web design", "Development"], // TODO: real stack (e.g. React, Next.js, WordPress…)
    // Live screenshot of the site via WordPress's public mShots service (fetched in
    // the visitor's browser). TODO: for full control, save a real screenshot to
    // /public/projects/sunsky.png and point `image` at it instead.
    image: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fwww.sunskyjaipur.com?w=1200&h=750",
    fallbackImage: "/projects/sunsky.png",
    liveUrl: "https://www.sunskyjaipur.com",
    featured: true,
  },
  {
    slug: "lead-generation",
    title: "Real-estate lead automation",
    blurb:
      "A property enquiry form that instantly logs each lead to Google Sheets, emails the agent the details with a one-tap WhatsApp link, and auto-replies to the buyer promising a call within 30 minutes.",
    stack: ["n8n", "Webhooks", "Google Sheets", "Gmail"],
    image: "/projects/lead/workflow.png",
    gallery: [
      { src: "/projects/lead/form.png", caption: "A buyer fills in the property enquiry form — name, phone, email, city, property type and budget." },
      { src: "/projects/lead/workflow.png", caption: "n8n receives it through a webhook, tidies the fields, checks it's a valid lead, logs it to Google Sheets, then sends two emails." },
      { src: "/projects/lead/alert-email.png", caption: "The agent instantly gets a “New Lead” email with every detail and a one-tap WhatsApp link." },
      { src: "/projects/lead/auto-reply.png", caption: "At the same moment the buyer gets an automatic confirmation promising a call within 30 minutes." },
    ],
    note: "Private workflow",
  },
  {
    slug: "meeting-transcript",
    title: "Meeting notes automation",
    blurb:
      "Upload a meeting's notes and attendee list — an LLM (Groq) summarises them, the summary is saved to a Notion database, and every attendee gets it by email automatically.",
    stack: ["n8n", "Groq LLM", "Notion API", "Gmail"],
    image: "/projects/meeting/workflow.png",
    gallery: [
      { src: "/projects/meeting/form.png", caption: "Fill in the meeting title, date, the notes file (.txt) and the attendees' emails." },
      { src: "/projects/meeting/workflow.png", caption: "n8n reads the notes, asks Groq's LLM for a clean summary, and saves it as a page in a Notion “Meeting Summaries” database." },
      { src: "/projects/meeting/loop.png", caption: "It then loops over every attendee and emails each of them the summary through Gmail." },
    ],
    note: "Private workflow",
  },
];

export const PLACEHOLDER_IMAGE = "/projects/placeholder.png";
