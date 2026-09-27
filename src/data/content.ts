// Site-wide copy. Everything marked TODO is placeholder — edit freely.

export const site = {
  name: "Nandini Das",
  tagline: "Developer & automation builder",
  email: "nandiniii149@gmail.com",
  heroLabel: "// developer portfolio", // TODO: edit (small mono label above the card)
};

export const about = {
  // One accent word per heading goes in *asterisks*.
  heading: "Building things that *work* for you",
  paragraphs: [
    // TODO: replace with your own words.
    "I'm a developer who likes turning messy, repetitive work into clean systems — web apps people enjoy using, and automations that quietly run in the background.",
    "Most of my time goes into full-stack projects with React and TypeScript, and into automation with n8n and LLM-powered tools. I care about things that ship, stay fast and are easy to hand over.",
  ],
  // Short facts shown as mono labels next to the text.
  facts: [
    { label: "Based in", value: "TODO: city" }, // TODO
    { label: "Focus", value: "Full-stack & automation" },
    { label: "Status", value: "TODO: open to work?" }, // TODO
  ],
};

export const skills: { group: string; items: string[] }[] = [
  // TODO: adjust groups and items to your real stack.
  { group: "AI & automation", items: ["n8n", "LLM apps", "Prompt design", "APIs & webhooks"] },
  { group: "Full-stack", items: ["React", "TypeScript", "Vite", "Node.js"] },
  { group: "3D & motion", items: ["Three.js", "React Three Fiber", "GSAP", "WebGL shaders"] },
  { group: "Tooling", items: ["Git & GitHub", "Vercel", "Figma"] },
];

export const contact = {
  heading: "Let's build something *together*",
  blurb: "Have a project, a workflow to automate, or just want to say hi? My inbox is open.", // TODO: edit
  socials: [
    { label: "GitHub", href: "https://github.com/Nandini140906" }, // TODO: confirm
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nandini-das-808144338/" },
  ],
};

export const nav = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];
