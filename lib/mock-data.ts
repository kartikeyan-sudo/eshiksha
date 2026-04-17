export type Ebook = {
  id: string;
  title: string;
  author: string;
  price: number;
  cover: string;
  coverGradient: string;
  category: string;
  pages: number;
  rating: number;
  description: string;
  previewLines: string[];
  fullLines: string[];
  previewPageCount: number;
  isOwned?: boolean;
};

const cyberLines = [
  "Understanding the threat landscape is the first step in building resilient systems.",
  "Defense-in-depth strategies layer multiple security controls to mitigate risk.",
  "Network segmentation limits lateral movement after an initial breach.",
  "Encryption at rest and in transit protects sensitive data from interception.",
  "Zero-trust architecture assumes no implicit trust, even inside the perimeter.",
  "Incident response plans must be rehearsed regularly to remain effective.",
  "Social engineering exploits human psychology rather than technical vulnerabilities.",
  "Penetration testing reveals weaknesses before adversaries can exploit them.",
  "Security information and event management (SIEM) aggregates and correlates logs for rapid detection.",
  "Continuous monitoring and automated alerting are essential for modern SOC operations.",
  "Threat intelligence feeds provide context about emerging attack vectors and indicators of compromise.",
  "Application security testing should be integrated early in the software development lifecycle.",
];

export const ebooks: Ebook[] = [
  {
    id: "cyber-fundamentals",
    title: "Cybersecurity Fundamentals",
    author: "Dr. Arjun Menon",
    price: 14.99,
    cover: "#7c3aed",
    coverGradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
    category: "Foundations",
    pages: 240,
    rating: 4.8,
    description:
      "A comprehensive guide to cybersecurity principles covering threat modeling, defense-in-depth, and security operations for modern organizations.",
    previewLines: cyberLines.slice(0, 4),
    fullLines: cyberLines,
    previewPageCount: 4,
    isOwned: true,
  },
  {
    id: "network-defense",
    title: "Network Defense & Architecture",
    author: "Lt. Priya Sharma",
    price: 24.0,
    cover: "#059669",
    coverGradient: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)",
    category: "Networking",
    pages: 310,
    rating: 4.6,
    description:
      "From firewalls to zero-trust networks, this book covers practical network defense strategies and modern architecture patterns.",
    previewLines: cyberLines.slice(0, 3),
    fullLines: cyberLines.map((line) => `${line} — Extended analysis included.`),
    previewPageCount: 3,
  },
  {
    id: "ethical-hacking",
    title: "Ethical Hacking Mastery",
    author: "Rahul Kapoor",
    price: 29.99,
    cover: "#dc2626",
    coverGradient: "linear-gradient(135deg, #dc2626 0%, #e11d48 50%, #be185d 100%)",
    category: "Offensive Security",
    pages: 420,
    rating: 4.9,
    description:
      "Master penetration testing techniques, vulnerability assessment, and responsible disclosure practices used by professional ethical hackers.",
    previewLines: cyberLines.slice(0, 5),
    fullLines: [...cyberLines, "Advanced exploitation techniques and post-exploitation strategies."],
    previewPageCount: 5,
  },
  {
    id: "cloud-security",
    title: "Cloud Security Essentials",
    author: "Sneha Iyer",
    price: 19.5,
    cover: "#2563eb",
    coverGradient: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #9333ea 100%)",
    category: "Cloud",
    pages: 280,
    rating: 4.5,
    description:
      "Secure your cloud infrastructure across AWS, Azure, and GCP with practical hardening guides, IAM best practices, and compliance frameworks.",
    previewLines: cyberLines.slice(0, 4),
    fullLines: [...cyberLines, "Cloud-native security tools and container hardening."],
    previewPageCount: 4,
    isOwned: true,
  },
  {
    id: "incident-response",
    title: "Incident Response Playbook",
    author: "Col. Vikram Das",
    price: 34.0,
    cover: "#d97706",
    coverGradient: "linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)",
    category: "Operations",
    pages: 350,
    rating: 4.7,
    description:
      "A field-tested playbook for security operations centers covering detection, triage, containment, eradication, and recovery procedures.",
    previewLines: cyberLines.slice(0, 3),
    fullLines: [...cyberLines, "Real-world incident case studies and post-mortem templates."],
    previewPageCount: 3,
  },
  {
    id: "malware-analysis",
    title: "Malware Analysis & Reverse Engineering",
    author: "Dr. Kavya Nair",
    price: 39.99,
    cover: "#7c3aed",
    coverGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
    category: "Research",
    pages: 480,
    rating: 4.9,
    description:
      "Deep-dive into static and dynamic malware analysis, assembly-level reverse engineering, and automated sandboxing techniques.",
    previewLines: cyberLines.slice(0, 4),
    fullLines: [...cyberLines, "Building custom YARA rules and behavioral detection signatures."],
    previewPageCount: 4,
  },
];

export function getEbookById(id: string) {
  return ebooks.find((book) => book.id === id);
}
