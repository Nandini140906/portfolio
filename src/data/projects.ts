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
  /** Plain-language "How it works" walkthrough (for non-technical visitors). */
  howItWorks?: HowItWorks;
  featured?: boolean;
}

export interface HowItWorks {
  /** One or two sentences: what problem it solves, in everyday words. */
  summary: string;
  steps: {
    title: string;
    text: string;
    image: string;
    /** Optional labelled breakdown, e.g. what each box in the workflow does. */
    parts?: { name: string; text: string }[];
  }[];
  /** What the client gets out of it. */
  results: string[];
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
    howItWorks: {
      summary:
        "When someone is interested in buying a property, every minute counts. This automation makes sure no enquiry is ever missed: the moment a buyer fills in the form, the agent is alerted, the buyer gets a reply, and the lead is saved — all within seconds, with nobody typing anything.",
      steps: [
        {
          title: "A buyer shows interest",
          text: "On the website, the buyer fills in a short enquiry form: their name, phone number, email, city, the type of property they want and their budget. Then they press Submit. That's all they need to do.",
          image: "/projects/lead/form.png",
        },
        {
          title: "The automation takes over instantly",
          text: "The moment Submit is pressed, the details are sent to n8n — a tool that connects different apps together and does jobs automatically, like a digital assistant that never sleeps. Each box below is one small job it does, in order, left to right:",
          image: "/projects/lead/workflow.png",
          parts: [
            { name: "Webhook", text: "The “doorbell”. It receives the buyer's details the instant the form is sent." },
            { name: "Edit Fields", text: "Tidies up the information so names, phone numbers and budgets are always in the same neat format." },
            { name: "If", text: "A quick check that it's a genuine enquiry (not empty or spam). Only real leads carry on." },
            { name: "Append row in sheet", text: "Adds the lead as a new row in a Google Sheet, so every enquiry is saved in one list automatically." },
            { name: "Send a message (×2)", text: "Sends two emails at the same time — one to the agent and one to the buyer." },
          ],
        },
        {
          title: "The agent is alerted in seconds",
          text: "The agent instantly receives a “New Lead” email with all the buyer's details neatly laid out, plus a one-tap WhatsApp link to message the buyer straight away — no copying numbers, no searching.",
          image: "/projects/lead/alert-email.png",
        },
        {
          title: "The buyer gets an instant reply",
          text: "At the same moment, the buyer receives a friendly confirmation email saying their enquiry was received and the team will call within 30 minutes. They feel looked after, so they're far less likely to go to a competitor.",
          image: "/projects/lead/auto-reply.png",
        },
      ],
      results: [
        "Every enquiry answered in seconds, day or night",
        "No lead is ever lost or forgotten",
        "All leads saved automatically in one Google Sheet",
        "Zero manual typing or copy-pasting",
      ],
    },
    note: "Private workflow",
  },
  {
    slug: "meeting-transcript",
    title: "Meeting notes automation",
    blurb:
      "Upload a meeting's notes and attendee list — an LLM (Groq) summarises them, the summary is saved to a Notion database, and every attendee gets it by email automatically.",
    stack: ["n8n", "Groq LLM", "Notion API", "Gmail"],
    image: "/projects/meeting/workflow.png",
    howItWorks: {
      summary:
        "After a meeting, someone usually has to write up the notes and email them to everyone — and it often gets delayed or forgotten. This automation does it for you: upload the notes once, and AI writes a clear summary, files it neatly, and sends it to every attendee.",
      steps: [
        {
          title: "Share the meeting notes",
          text: "Fill in a simple form: the meeting title, the date, upload the notes file, and list who attended with their email addresses. That's the only thing a person has to do.",
          image: "/projects/meeting/form.png",
        },
        {
          title: "AI writes the summary and files it",
          text: "The form is sent to n8n, a tool that connects apps and runs jobs automatically. Each box is one small job, done in order:",
          image: "/projects/meeting/workflow.png",
          parts: [
            { name: "Webhook", text: "Receives the form the moment it's submitted." },
            { name: "Code boxes", text: "Read the notes file and the list of attendees, and put them in a tidy format." },
            { name: "HTTP Request → Groq", text: "Sends the notes to an AI (Groq), which reads them and writes a short, clear summary of the main points." },
            { name: "HTTP Request → Notion", text: "Saves the summary as a new page in a Notion “Meeting Summaries” table, so every meeting is kept in one searchable place." },
          ],
        },
        {
          title: "Everyone gets it by email",
          text: "Finally, the automation goes through the attendee list one person at a time (the “Loop Over Items” box) and sends each of them an email with the summary. Nobody is left out, and nobody has to press Send.",
          image: "/projects/meeting/loop.png",
        },
      ],
      results: [
        "No one has to write up or send meeting notes",
        "Everyone gets the same clear summary, minutes after the meeting",
        "Every meeting archived in Notion, easy to find later",
      ],
    },
    note: "Private workflow",
  },
];

export const PLACEHOLDER_IMAGE = "/projects/placeholder.png";
