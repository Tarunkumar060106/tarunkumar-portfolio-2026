// All site copy lives here — edit this file to change text without touching components.
// Source: Tarunkumar S resume (2026).

export const site = {
  // Canonical URL used for SEO (canonical link, sitemap, Open Graph, structured data, llms.txt).
  // Change this once the custom domain is live. Can also be overridden at build time with SITE_URL.
  url: 'https://tarunkumar-portfolio-2026.vercel.app',
  name: 'Tarunkumar Sivakumar',
  role: 'Software engineer · AI',
  location: 'Chennai, India',
  timeZone: 'Asia/Kolkata',
  // Public contact email (used by the Email / Copy buttons and the menu). From the resume — swap if you prefer another.
  email: 'ts0147@srmist.edu.in',
  socials: [
    { label: 'GitHub', href: 'https://github.com/Tarunkumar060106' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tarunkumar06/' },
    { label: 'Instagram', href: 'https://www.instagram.com/_tarun.kumar06_' },
  ],
}

export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Stack', href: '#stack' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
]

export const hero = {
  eyebrow: `${site.name} · ${site.role}`,
  // Headline reads: "{lead} / {one of rotating} / {tail}" — the middle line decodes between phrases.
  lead: 'I build',
  rotating: ['AI agents', 'microservices', 'full-stack apps', 'cloud platforms', 'real-time systems'],
  tail: 'that actually ship.',
  sub: 'CS student at SRMIST building distributed systems, agentic AI and full-stack products. Future founder.',
  cta: { label: 'See my work', href: '#work' },
  footer: 'Open to software engineering and AI internships in 2026.',
}

export const about = {
  // Written from Tarun's "soul interview": playful, first person, builder-first.
  title: 'Builder first. Founder next.',
  statement:
    'I’m Tarun, a CS student at SRMIST who builds AI agents, microservices and full-stack products, and treats every one of them like day one of a startup.',
  body: [
    'My favourite so far is Mailmind, an AI email client that reads your inbox so you don’t have to (mostly). Around it: a Kubernetes-hosted banking platform, microservices with live observability, and a skill-gap analyser that interviews you back.',
    'The long game? Start a company and take it all the way to Silicon Valley. Until then I lead the Spatial Computing Lab, mentor student engineers, and run workshops on REST APIs and agentic AI.',
    'Friends call me a leader; I’d add compassionate, and a little too passionate about everything I touch. Fun fact: I started out in the biology stream and switched to engineering after 12th grade. Off the keyboard, I’m gaming or buried in a book.',
  ],
  focus: ['Distributed systems', 'Agentic AI systems', 'Cloud & microservices', 'Simulation & digital twins'],
  offClock: ['Gaming', 'Reading', 'Startup ideas at 2 a.m.'],
  education: {
    degree: 'B.Tech, Computer Science & Engineering',
    school: 'SRM IST, Kattankulathur',
    detail: 'Class of 2027 · CGPA 9.64',
  },
  availability: 'Open to remote work worldwide.',
}

export const projectFilters = ['All', 'AI', 'Backend', 'Web', 'Mobile'] as const
export type ProjectCategory = Exclude<(typeof projectFilters)[number], 'All'>

export type Project = {
  name: string
  kind: string
  /** Drives the filter chips in the Work section. */
  categories: ProjectCategory[]
  period: string
  summary: string
  highlights: string[]
  tags: string[]
  href: string
}

export const projects: Project[] = [
  {
    name: 'Mailmind',
    kind: 'AI email client',
    categories: ['AI', 'Web'],
    period: 'Since Feb 2026',
    summary:
      'An AI-powered email client that categorises, prioritises and summarises your inbox so the important messages surface first.',
    highlights: [
      'Intelligent summarisation and content analysis to understand long threads at a glance.',
      'Natural-language search and filtering for fast email retrieval.',
      'Automatic classification, priority detection and response assistance.',
    ],
    tags: ['AI', 'NLP', 'Summarisation', 'Automation'],
    href: 'https://mailmind.radiantsofficial.com/',
  },
  {
    name: 'GDB Banking',
    kind: 'Distributed banking · Microservices',
    categories: ['Backend'],
    period: 'Since Feb 2026',
    summary:
      'A distributed banking platform split into Spring Boot microservices for auth, accounts, transactions, payments and users.',
    highlights: [
      'Secure REST APIs with Spring Security, JWT and PostgreSQL, with robust validation and error handling.',
      'Containerised with Docker, orchestrated on Kubernetes and hosted on Microsoft Azure.',
      'Dedicated services for credit cards, transaction analytics and regulatory compliance.',
    ],
    tags: ['Spring Boot', 'Spring Security', 'PostgreSQL', 'Docker', 'Kubernetes', 'Azure'],
    href: 'https://gitlab.com/fsd-team2/GDB-Complete',
  },
  {
    name: 'Skill Gap Analyzer',
    kind: 'AI career tooling',
    categories: ['AI', 'Web'],
    period: 'Since Feb 2026',
    summary:
      'Maps your technical skills against role requirements, shows exactly where the gaps are, and helps you close them.',
    highlights: [
      'Competency-gap analysis against role-based skill requirements.',
      'Structured learning paths with resources targeted at each gap.',
      'Automated technical interview module that simulates real interviews and scores readiness.',
    ],
    tags: ['AI', 'Skill analysis', 'Learning paths', 'Mock interviews'],
    href: 'https://skill-gap-analyzer-iota.vercel.app/',
  },
  {
    name: 'MicroLens',
    kind: 'Microservices · Observability',
    categories: ['Backend', 'Web'],
    period: 'Dec 2025 to Jan 2026',
    summary:
      'A Dockerised microservices architecture with a live observability dashboard for service health, logs and performance.',
    highlights: [
      'Services built with Django REST Framework and FastAPI.',
      'Redis for inter-service communication and asynchronous data exchange.',
      'React dashboard visualising real-time health, logs and metrics.',
    ],
    tags: ['Django REST', 'FastAPI', 'Redis', 'Docker', 'React'],
    href: 'https://github.com/Tarunkumar060106/microlens',
  },
  {
    name: 'HaloHUD',
    kind: 'Mobile · Real-time',
    categories: ['Mobile'],
    period: 'Since Feb 2025',
    summary:
      'A React Native companion app for a heads-up display, streaming live device data over Bluetooth.',
    highlights: [
      'Real-time monitoring UI for live data and device interaction.',
      'Bluetooth link between the app and an Arduino-based device.',
      'Built with the Spatial Computing Lab (SCL).',
    ],
    tags: ['React Native', 'Real-time', 'Bluetooth'],
    href: 'https://github.com/Tarunkumar060106/HaloHud-Final',
  },
]

export const stack = [
  { group: 'Languages', items: ['Python', 'Java', 'TypeScript', 'C', 'C++'] },
  { group: 'Frameworks', items: ['React', 'React Native', 'Next.js', 'Node.js', 'Django', 'FastAPI', 'Spring Boot'] },
  { group: 'Data & cloud', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Appwrite', 'Azure', 'Oracle Cloud'] },
  {
    group: 'Systems',
    items: ['Microservices', 'REST API design', 'Event-driven systems', 'WebSockets', 'JWT & OAuth', 'Agentic AI'],
  },
  { group: 'DevOps & tools', items: ['Docker', 'Kubernetes', 'Linux', 'Git', 'GitHub', 'Unity'] },
]

export type Role = {
  period: string
  role: string
  org: string
  note: string
  /** Optional link for the organisation / event (rendered on the org name). */
  href?: string
  description: string
}

export const experience: Role[] = [
  {
    period: 'Since Jan 2026',
    role: 'Digital Media & Technology',
    org: 'Intelligent Systems Design Lab, SRMIST',
    note: 'Core Team',
    description:
      'Led the lab’s digital media and technology, running its online outreach and a weekly content calendar of Blender visuals and FastAPI-powered demos that grew engagement and event registrations. Mentored students building C, MySQL and FastAPI projects through to showcase-ready prototypes.',
  },
  {
    period: 'Since Aug 2025',
    role: 'President',
    org: 'Spatial Computing Lab, SRMIST',
    note: 'Core Team',
    description:
      'Lead student initiatives in spatial computing and simulation. Organise workshops on REST API design and agentic AI, and mentor members building secure Django + OAuth platforms and distributed systems. Three prototypes are now demo-ready.',
  },
  {
    period: 'Aug 2026',
    role: 'Organizer',
    org: 'International RoboFest 2.0',
    note: 'Website + organising · ISD Lab',
    href: 'https://robofest.in',
    description:
      'Built the official website, robofest.in, and helped organise SRMIST’s international robotics competition: 9 event categories, a ₹7,00,000 prize pool and teams travelling in from outside India.',
  },
  {
    period: 'Sep 2025',
    role: 'Organizer',
    org: 'RoboFest’25',
    note: 'Event website + operations',
    description:
      'Built the event website and ran registrations, participant management and competition logistics for SRMIST’s robotics festival, working with faculty and volunteers.',
  },
]

export const certifications = [
  { name: 'OCI Architect Associate', issuer: 'Oracle', year: '2025' },
  { name: 'OCI Data Science Professional', issuer: 'Oracle', year: '2025' },
]

export const contact = {
  title: 'Have an idea? Let’s build it.',
  body: 'Hiring for an internship, or building something with distributed systems, AI agents or the cloud? I’d love to hear about it.',
}
