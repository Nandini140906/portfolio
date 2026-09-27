export interface Project {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  /** Path under /public. Falls back to the placeholder if the file is missing. */
  image: string;
  liveUrl: string;
  repoUrl?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "REAL-PROJECT-SLUG", // TODO: real slug
    title: "TODO: real project title",
    blurb: "TODO: one line on what it does / the outcome.",
    stack: ["TODO", "TODO"], // TODO: real stack
    image: "/projects/real-1.png", // TODO: drop screenshot in /public/projects/
    liveUrl: "https://TODO", // TODO: real live link
    repoUrl: "", // optional
    featured: true,
  },
  // --- placeholders below; replace as portfolio grows ---
  { slug: "placeholder-2", title: "Project Two", blurb: "Placeholder — swap later.", stack: ["React", "TS"], image: "/projects/placeholder.png", liveUrl: "#", featured: false },
  { slug: "placeholder-3", title: "Project Three", blurb: "Placeholder — swap later.", stack: ["n8n", "LLM"], image: "/projects/placeholder.png", liveUrl: "#", featured: false },
];

export const PLACEHOLDER_IMAGE = "/projects/placeholder.png";
