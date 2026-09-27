// Site-wide copy. Edit freely — one accent word per heading goes in *asterisks*.

export const site = {
  name: "Nandini Das",
  tagline: "Developer & automation builder",
  email: "nandiniii149@gmail.com",
};

/** "Say hello" opens WhatsApp with this message already typed. */
export const whatsapp = {
  number: "918485046895", // international format, no + or spaces
  message:
    "Hi Nandini! I came across your portfolio and I'd love to talk about a project. Are you available for a quick chat?",
};
export const whatsappUrl = `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(whatsapp.message)}`;

export const about = {
  heading: "I build things that *work* for your business",
  paragraphs: [
    "Your team shouldn't spend hours copying leads into spreadsheets, chasing follow-ups or writing up meeting notes. I build automations that do that work for you — instantly, accurately, around the clock — so you can focus on closing deals and serving clients.",
    "I also design and build fast, modern websites that make a strong first impression and turn visitors into enquiries. From the first idea to launch, you get one person who understands both the design and the systems behind it — and who stays until it works exactly the way you need.",
  ],
  facts: [
    { label: "What I do", value: "Automation & websites" },
    { label: "Turnaround", value: "Fast, clear updates" },
    { label: "Status", value: "Open to new projects" },
  ],
};

export const skills: { group: string; items: string[] }[] = [
  { group: "Automation", items: ["n8n", "Python", "FastAPI", "APIs", "Browser automation"] },
  { group: "Websites", items: ["Figma", "Three.js", "AI tools"] },
];

export const contact = {
  heading: "Let's build something *together*",
  blurb: "Have a project, a workflow to automate, or just want to say hi? Message me on WhatsApp or drop an email.",
  socials: [
    { label: "GitHub", href: "https://github.com/Nandini140906" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nandini-das-808144338/" },
  ],
};

export const nav = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];
