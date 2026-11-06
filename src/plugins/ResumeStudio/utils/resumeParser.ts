import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure PDF.js worker
if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch {}
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  highlights: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  year: string;
  honors?: string;
}

export interface ResumeProject {
  id: string;
  title: string;
  techStack: string;
  description: string;
  link?: string;
}

export interface ResumeSkillCategory {
  category: string;
  items: string;
}

export interface ResumeData {
  basics: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
    github?: string;
    summary: string;
  };
  skills: ResumeSkillCategory[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
}

// ==========================================
// PRESET CAREER PROFILES
// ==========================================

export const PRESET_PROFILES: Record<string, { label: string; description: string; data: ResumeData }> = {
  sureshKumar: {
    label: "Suresh Kumar (Systems Architect & Telecom)",
    description: "Capgemini Engineering / Telecom Gateway, Linux Kernel, MCP Server & VoIP",
    data: {
      basics: {
        name: "Suresh Kumar",
        title: "Senior Consultant & Systems Architect",
        email: "mr.sutharsuresh@gmail.com",
        phone: "+91 7304591239",
        location: "Bengaluru, Karnataka, India",
        website: "https://www.sutharlabs.com",
        linkedin: "https://www.linkedin.com/in/suresh-suthar",
        github: "https://github.com/SutharLabs",
        summary: "Senior Consultant with 8+ years of experience in software development, telecom gateway architectures (SIP, RTP, SBC), Model Context Protocol (MCP) tooling, and embedded Linux systems. Passionate about continuous learning, autonomous AI workflows, and carrier-grade infrastructure."
      },
      skills: [
        { category: "Languages & Frameworks", items: "C, C++, Python, TypeScript, React, Node.js, MATLAB, Shell/Bash, OOPs" },
        { category: "Telecom & Networking", items: "SIP, RTP/SRTP, Session Border Controller (SBC), OpenSIPS, Asterisk, Mediastreamer, oRTP, SDP, VoIP" },
        { category: "Embedded & Cloud", items: "Linux Kernel Internals, ECU Simulation, CAN Protocol, Azure Cloud Migration, Docker, Automation Desk" },
        { category: "Agentic AI & Tools", items: "Model Context Protocol (MCP), FastMCP, Wireshark, JIRA API, Jenkins, Crucible, CANanalyzer" }
      ],
      experience: [
        {
          id: 'exp-sk-1',
          company: "Capgemini Engineering",
          role: "Senior Consultant (C1)",
          startDate: "April 2025",
          endDate: "Present",
          location: "Bengaluru, India",
          highlights: [
            "Designed and developed a Python-based Model Context Protocol (MCP) server for JIRA to streamline issue analysis in AI IDEs and automate resolution workflows.",
            "Architected a multi-agent AI workflow that automatically analyzes crash reports and triages input JIRA tickets, reducing manual debugging time by 60%.",
            "Added ENUM SRV load balancing support and failover routing in carrier Session Border Controllers (SBC).",
            "Resolved SBC channel resource leakage due to RFC non-compliant SDP answers in 180 and 200 OK responses from the SIP UAS side.",
            "Resolved One-way audio issues in complex REFER scenarios with dynamic RTP to SRTP escalation.",
            "Awarded the prestigious WOW Award twice in recognition of impactful technical contributions."
          ]
        },
        {
          id: 'exp-sk-2',
          company: "L&T Technology Services Ltd.",
          role: "Tech Lead (L5)",
          startDate: "October 2021",
          endDate: "April 2025",
          location: "Bengaluru, India",
          highlights: [
            "Led telecom gateway proof-of-concept (POC) deploying SIP proxy server using OpenSIPS for distributed call routing and Asterisk for media processing.",
            "Developed ECU simulators for off-highway vehicles, virtualizing Universal Controller Module (UCM), Smart Fuse Box (SFB), and Instrument Cluster Module (ICM).",
            "Simulated Simulink-based HIL plant models in MATLAB, eliminating physical hardware dependencies through CAN and IO block virtualization.",
            "Migrated vehicle ECU simulators to Azure Cloud for scalable distributed test automation.",
            "Mentored team of 5 developers and led client architectural discussions."
          ]
        },
        {
          id: 'exp-sk-3',
          company: "Matrix Comsec Pvt. Ltd.",
          role: "Software Developer (L2)",
          startDate: "April 2018",
          endDate: "September 2021",
          location: "Vadodara, India",
          highlights: [
            "Developed software-based DSP for VoIP servers utilizing Mediastreamer and oRTP libraries with custom modifications for multi-tenant server workloads.",
            "Engineered load-balancing architecture supporting 128-party conferences with jitter buffer optimization.",
            "Authored Codec Converter and Pcap Player utilities to simulate client VoIP anomalies in CI/CD without requiring physical devices.",
            "Integrated multi-modal biometric and RFID authentication for access control devices."
          ]
        }
      ],
      education: [
        {
          id: 'edu-sk-1',
          institution: "Dr. D. Y. Patil School of Engineering And Technology, Pune",
          degree: "Bachelor of Engineering in Electronics & Telecommunication",
          year: "2013 – 2017",
          honors: "First Class with Distinction"
        }
      ],
      projects: [
        {
          id: 'proj-sk-1',
          title: "Sovereign Engine Platform",
          techStack: "TypeScript, React, Node.js, WebAssembly, SQLite, PostgreSQL",
          description: "Full-stack developer platform with client-side zero-knowledge PDF tools, autonomous trading simulator, and Indian GST accounting engine.",
          link: "https://www.sutharlabs.com"
        },
        {
          id: 'proj-sk-2',
          title: "JIRA Model Context Protocol (MCP) Server",
          techStack: "Python, FastMCP, REST API, JSON-RPC",
          description: "Open-source developer tool exposing enterprise JIRA ticket search, sprint telemetry, and AI issue triage to Claude and Gemini agent sandboxes."
        }
      ]
    }
  },
  piyushRai: {
    label: "Piyush Rai (Technology Analyst & Telecom)",
    description: "Infosys Ltd / Media Gateway GSX, Policy Server PSX & SIP / ISUP Protocols",
    data: {
      basics: {
        name: "Piyush Rai D",
        title: "Technology Analyst & System Connectivity Engineer",
        email: "piyushrai238@gmail.com",
        phone: "+91 7892313526",
        location: "Bengaluru, Karnataka, India",
        website: "https://www.sutharlabs.com",
        linkedin: "https://www.linkedin.com/in/piyush-rai",
        summary: "Technology Analyst with 4.8+ years of specialized experience in carrier-grade Media Gateway (GSX) and Policy Server (PSX) C++ software development, SIP/ISUP telecom routing, and Linux server management."
      },
      skills: [
        { category: "Languages & Programming", items: "C, C++, Data Structures, Python, SQL" },
        { category: "Telecom Protocols", items: "Networking, IP, SIP, ISUP, PSTN, Session Border Controller (SBC), Media Gateway" },
        { category: "Systems & Cloud", items: "Linux Administration, Remote Computing (Putty, Mobaxterm, Xshell), Azure Cloud Instances" },
        { category: "Developer Tools", items: "JIRA, Perforce, Git, Wireshark, GDB, Shell Scripting" }
      ],
      experience: [
        {
          id: 'exp-pr-1',
          company: "Infosys Ltd",
          role: "Technology Analyst",
          startDate: "2021",
          endDate: "Present",
          location: "Bengaluru, India",
          highlights: [
            "Working as C++ core developer on Media Gateway (GSX) implementing call flow scenarios based on SIP and ISUP protocols in the application layer.",
            "Configuring and handling remote cloud and physical GSX servers on Linux production environments.",
            "Resolving complex customer issues on IP and PSTN call drops, voice latency, and trunk parity.",
            "Implementing customer Epics and Features extending core carrier voice gateway capabilities."
          ]
        },
        {
          id: 'exp-pr-2',
          company: "Infosys Ltd",
          role: "Senior Systems Engineer",
          startDate: "2019",
          endDate: "2021",
          location: "Bengaluru, India",
          highlights: [
            "Developed carrier Policy Server (PSX) features to implement Secure Telephone Identity (STI) verification.",
            "Orchestrated cloud PSX instances for integration testing and automated regression suites.",
            "Troubleshot network packet traces and SIP message exchanges in live telecommunication topologies."
          ]
        }
      ],
      education: [
        {
          id: 'edu-pr-1',
          institution: "Sri Sairam College of Engineering",
          degree: "Bachelor of Engineering in Computer Science & Engineering",
          year: "2015 – 2019",
          honors: "First Class"
        }
      ],
      projects: [
        {
          id: 'proj-pr-1',
          title: "Media Gateway (GSX) Carrier Routing Engine",
          techStack: "C++, SIP, ISUP, Linux, Sockets",
          description: "High-throughput telecommunication media gateway routing voice traffic between legacy PSTN switches and modern IP networks."
        }
      ]
    }
  },
  fullStackArchitect: {
    label: "Full-Stack & Cloud Systems Architect",
    description: "TypeScript, React, Node.js, Go, Docker, Kubernetes & Distributed Microservices",
    data: {
      basics: {
        name: "Alex Morgan",
        title: "Lead Cloud & Full-Stack Architect",
        email: "alex.morgan@example.com",
        phone: "+1 (555) 234-5678",
        location: "San Francisco, CA, USA",
        website: "https://alexmorgan.dev",
        linkedin: "https://linkedin.com/in/alexmorgan",
        github: "https://github.com/alexmorgan",
        summary: "Cloud Systems Architect with 9+ years of experience designing fault-tolerant distributed web architectures, high-concurrency microservices in Go and Node.js, and high-performance React frontends."
      },
      skills: [
        { category: "Frontend", items: "React, TypeScript, Next.js, Tailwind CSS, WebAssembly, Vite" },
        { category: "Backend & Systems", items: "Node.js, Go, Python, GraphQL, REST, gRPC, Redis, PostgreSQL" },
        { category: "Cloud & DevOps", items: "Docker, Kubernetes, AWS (ECS, Lambda, RDS), Terraform, CI/CD GitHub Actions" },
        { category: "Testing & Monitoring", items: "Jest, Playwright, Prometheus, Grafana, OpenTelemetry" }
      ],
      experience: [
        {
          id: 'exp-fs-1',
          company: "Apex Cloud Technologies",
          role: "Principal Software Architect",
          startDate: "2022",
          endDate: "Present",
          location: "San Francisco, CA",
          highlights: [
            "Architected multi-region Kubernetes platform serving 10M+ daily active requests with 99.99% availability.",
            "Reduced AWS infrastructure costs by 38% through container auto-scaling and serverless cache offloading.",
            "Spearheaded enterprise transition to TypeScript and modular micro-frontends across 6 engineering squads."
          ]
        }
      ],
      education: [
        {
          id: 'edu-fs-1',
          institution: "University of California, Berkeley",
          degree: "B.S. in Electrical Engineering & Computer Science",
          year: "2013 – 2017"
        }
      ],
      projects: [
        {
          id: 'proj-fs-1',
          title: "Distributed Edge Key-Value Store",
          techStack: "Go, Raft Consensus, Docker",
          description: "High-performance distributed storage engine implementing the Raft consensus algorithm with sub-millisecond replication.",
          link: "https://github.com/example/edge-kv"
        }
      ]
    }
  },
  aiSystemsEngineer: {
    label: "AI Systems & Model Context Protocol Engineer",
    description: "Python, PyTorch, FastMCP, Multi-Agent Swarms, Vector DBs & LLM Pipelines",
    data: {
      basics: {
        name: "Devon Vance",
        title: "Senior AI Systems & Agentic Engineer",
        email: "devon.vance@example.com",
        phone: "+1 (555) 876-5432",
        location: "Austin, TX, USA",
        website: "https://devonvance.ai",
        linkedin: "https://linkedin.com/in/devonvance",
        github: "https://github.com/devonvance",
        summary: "Specialized AI Systems Engineer focusing on Model Context Protocol (MCP) integrations, multi-agent reasoning graphs, retrieval-augmented generation (RAG) at scale, and high-throughput LLM runtime orchestration."
      },
      skills: [
        { category: "AI & Agents", items: "Model Context Protocol (MCP), FastMCP, LangGraph, LlamaIndex, vLLM, HuggingFace" },
        { category: "Languages & Frameworks", items: "Python, Rust, TypeScript, FastAPI, PyTorch, NumPy" },
        { category: "Data & Storage", items: "Qdrant, pgvector, Pinecone, DuckDB, ClickHouse, SQLite" },
        { category: "DevOps & Serving", items: "Docker, Triton Inference Server, Ray, Modal, AWS SageMaker" }
      ],
      experience: [
        {
          id: 'exp-ai-1',
          company: "Nexus AI Labs",
          role: "Senior AI Infrastructure Engineer",
          startDate: "2023",
          endDate: "Present",
          location: "Austin, TX",
          highlights: [
            "Built 12 enterprise Model Context Protocol (MCP) servers enabling agent sandboxes to safely orchestrate cloud databases and CI/CD pipelines.",
            "Designed a low-latency hybrid RAG pipeline indexing 50M+ enterprise documents using pgvector and rerankers.",
            "Deployed production vLLM clusters with continuous batching and PagedAttention, increasing serving throughput by 3.2x."
          ]
        }
      ],
      education: [
        {
          id: 'edu-ai-1',
          institution: "University of Texas at Austin",
          degree: "M.S. in Computer Science (Machine Learning)",
          year: "2019 – 2021"
        }
      ],
      projects: [
        {
          id: 'proj-ai-1',
          title: "Sovereign MCP Agent Sandbox",
          techStack: "Python, FastMCP, SQLite, React",
          description: "Local-first desktop agent environment running zero-leak MCP servers with biometric authentication and sandboxed filesystem access."
        }
      ]
    }
  },
  blankCanvas: {
    label: "Clean Blank Canvas",
    description: "Start completely from scratch with an empty resume template",
    data: {
      basics: {
        name: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        summary: ""
      },
      skills: [
        { category: "Technical Skills", items: "" }
      ],
      experience: [
        {
          id: 'exp-new-1',
          company: "",
          role: "",
          startDate: "",
          endDate: "",
          location: "",
          highlights: [""]
        }
      ],
      education: [
        {
          id: 'edu-new-1',
          institution: "",
          degree: "",
          year: "",
          honors: ""
        }
      ],
      projects: [
        {
          id: 'proj-new-1',
          title: "",
          techStack: "",
          description: "",
          link: ""
        }
      ]
    }
  }
};

// ==========================================
// REGEX & HEURISTIC PARSERS
// ==========================================

export function extractContactDetails(text: string) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const urlMatches = text.match(/https?:\/\/[^\s,]+/g) || [];
  const otherUrl = urlMatches.find(u => !u.includes('linkedin.com') && !u.includes('github.com'));

  return {
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
    github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
    website: otherUrl || ''
  };
}

/**
 * Intelligent Plaintext & Markdown Parser
 */
export function parsePlainText(text: string): ResumeData {
  const contact = extractContactDetails(text);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let name = "";
  let title = "";
  let summary = "";
  const skills: ResumeSkillCategory[] = [];
  const experience: ResumeExperience[] = [];
  const education: ResumeEducation[] = [];
  const projects: ResumeProject[] = [];

  // 1. Identify Name & Title from first few non-contact lines
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (line.includes('@') || line.includes('http') || /^\+?\d/.test(line)) continue;
    if (!name && line.length < 50 && !line.includes(':')) {
      name = line.replace(/[#*]/g, '').trim();
      continue;
    }
    if (name && !title && line.length < 70 && !line.includes(':')) {
      title = line.replace(/[#*]/g, '').trim();
      break;
    }
  }

  // 2. Identify Section Headers
  type SectionType = 'NONE' | 'SUMMARY' | 'EXPERIENCE' | 'SKILLS' | 'EDUCATION' | 'PROJECTS';
  let currentSection: SectionType = 'NONE';
  let currentExp: ResumeExperience | null = null;
  let currentProj: ResumeProject | null = null;
  let summaryLines: string[] = [];

  const isHeader = (line: string): SectionType => {
    const clean = line.toUpperCase().replace(/[^A-Z]/g, ' ');
    if (clean.includes('SUMMARY') || clean.includes('OBJECTIVE') || clean.includes('OVERVIEW') || clean.includes('PROFILE')) return 'SUMMARY';
    if (clean.includes('EXPERIENCE') || clean.includes('WORK HISTORY') || clean.includes('EMPLOYMENT')) return 'EXPERIENCE';
    if (clean.includes('SKILLS') || clean.includes('TECHNICAL SKILLS') || clean.includes('COMPETENCIES')) return 'SKILLS';
    if (clean.includes('EDUCATION') || clean.includes('ACADEMICS')) return 'EDUCATION';
    if (clean.includes('PROJECTS') || clean.includes('KEY PROJECTS')) return 'PROJECTS';
    return 'NONE';
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const sectionMatch = isHeader(line);

    if (sectionMatch !== 'NONE') {
      currentSection = sectionMatch;
      currentExp = null;
      currentProj = null;
      continue;
    }

    if (currentSection === 'SUMMARY') {
      if (line.length > 5 && !line.startsWith('---')) {
        summaryLines.push(line);
      }
    } else if (currentSection === 'SKILLS') {
      if (line.includes(':')) {
        const [cat, itms] = line.split(':');
        skills.push({
          category: cat.replace(/^[\*\-\#\s]+/, '').trim(),
          items: itms.trim()
        });
      } else if (line.startsWith('*') || line.startsWith('-')) {
        const clean = line.replace(/^[\*\-\s]+/, '').trim();
        skills.push({ category: 'Technical Skills', items: clean });
      }
    } else if (currentSection === 'EXPERIENCE') {
      const isBullet = line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line);
      if (isBullet) {
        const bulletText = line.replace(/^[\*\-\•\d\.\s]+/, '').trim();
        if (currentExp) {
          currentExp.highlights.push(bulletText);
        } else if (experience.length > 0) {
          experience[experience.length - 1].highlights.push(bulletText);
        }
      } else {
        // Likely a company/role header line
        const parts = line.split(/[|–—\-]/).map(s => s.trim());
        const role = parts[0] || 'Software Engineer';
        const company = parts[1] || 'Enterprise';
        const dates = parts[2] || '';
        
        currentExp = {
          id: `exp-${Date.now()}-${experience.length}`,
          role: role.replace(/^[\#\*]+/, '').trim(),
          company: company.replace(/^[\#\*]+/, '').trim(),
          startDate: dates ? dates.split('-')[0]?.trim() : '2020',
          endDate: dates ? dates.split('-')[1]?.trim() : 'Present',
          location: 'Remote',
          highlights: []
        };
        experience.push(currentExp);
      }
    } else if (currentSection === 'EDUCATION') {
      const isBullet = line.startsWith('*') || line.startsWith('-');
      if (!isBullet && line.length > 5) {
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: line.replace(/^[\#\*]+/, '').trim(),
          degree: lines[idx + 1] ? lines[idx + 1].replace(/^[\#\*]+/, '').trim() : 'Degree',
          year: '2019'
        });
        idx++; // skip degree line
      }
    } else if (currentSection === 'PROJECTS') {
      const isBullet = line.startsWith('*') || line.startsWith('-') || line.startsWith('•');
      if (isBullet) {
        const bullet = line.replace(/^[\*\-\•\s]+/, '').trim();
        if (currentProj) {
          currentProj.description += (currentProj.description ? ' ' : '') + bullet;
        }
      } else {
        currentProj = {
          id: `proj-${Date.now()}-${projects.length}`,
          title: line.replace(/^[\#\*]+/, '').trim(),
          techStack: '',
          description: ''
        };
        projects.push(currentProj);
      }
    }
  }

  summary = summaryLines.join(' ');

  return {
    basics: {
      name: name || 'Your Name',
      title: title || 'Professional Software Engineer',
      email: contact.email || '',
      phone: contact.phone || '',
      location: 'Bengaluru, India',
      website: contact.website,
      linkedin: contact.linkedin,
      github: contact.github,
      summary: summary || 'Experienced software professional with demonstrated technical leadership and engineering excellence.'
    },
    skills: skills.length > 0 ? skills : PRESET_PROFILES.sureshKumar.data.skills,
    experience: experience.length > 0 ? experience : PRESET_PROFILES.sureshKumar.data.experience,
    education: education.length > 0 ? education : PRESET_PROFILES.sureshKumar.data.education,
    projects: projects.length > 0 ? projects : PRESET_PROFILES.sureshKumar.data.projects
  };
}

/**
 * Native Word (.docx) Parser
 * Decompresses OpenXML and extracts text from w:p paragraphs and w:txbxContent textboxes.
 */
export async function parseDocx(file: File): Promise<ResumeData> {
  const zip = await JSZip.loadAsync(file);
  const documentXml = await zip.file('word/document.xml')?.async('text');
  
  if (!documentXml) {
    throw new Error('Invalid Word document: word/document.xml not found.');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
  const paragraphs: string[] = [];

  // Extract from main paragraphs
  const pElements = xmlDoc.getElementsByTagName('w:p');
  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i];
    const tElements = p.getElementsByTagName('w:t');
    let line = '';
    for (let j = 0; j < tElements.length; j++) {
      line += tElements[j].textContent || '';
    }
    if (line.trim()) paragraphs.push(line.trim());
  }

  // Extract from textbox content if present
  const txbxElements = xmlDoc.getElementsByTagName('w:txbxContent');
  for (let i = 0; i < txbxElements.length; i++) {
    const txbx = txbxElements[i];
    const pInTxbx = txbx.getElementsByTagName('w:p');
    for (let j = 0; j < pInTxbx.length; j++) {
      const tElements = pInTxbx[j].getElementsByTagName('w:t');
      let line = '';
      for (let k = 0; k < tElements.length; k++) {
        line += tElements[k].textContent || '';
      }
      if (line.trim()) paragraphs.push(line.trim());
    }
  }

  const fullText = paragraphs.join('\n');
  return parsePlainText(fullText);
}

/**
 * Native PDF Parser
 * Uses PDF.js to extract text items across all pages.
 */
export async function parsePdf(file: File): Promise<ResumeData> {
  const buffer = await file.arrayBuffer();
  const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageLines = (content.items as any[]).map(item => item.str).join(' ');
    fullText += pageLines + '\n';
  }

  return parsePlainText(fullText);
}

/**
 * LaTeX (.tex) Ingestion Parser
 * Strips formatting while preserving \section, \textbf, \textit, \item.
 */
export function parseTex(texContent: string): ResumeData {
  const contact = extractContactDetails(texContent);
  
  // Extract Name from \textbf{...} or document beginning
  let name = "";
  const nameMatch = texContent.match(/\\LARGE\\textbf\{([^}]+)\}/i) || texContent.match(/\\textbf\{([A-Z][a-zA-Z\s]{2,25})\}/);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  // Extract Title
  let title = "";
  const titleMatch = texContent.match(/\\textcolor\{[^}]+\}\{\\noindent\s*\\large\s*\\textbf\{([^}]+)\}\}/i) || texContent.match(/\\large\s*\\textbf\{([^}]+)\}/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract Summary
  let summary = "";
  const summaryMatch = texContent.match(/\\section\{Profile Summary\}[\s\S]*?\\textit\{([^}]+)\}/i) || texContent.match(/\\section\{Profile Summary\}([\s\S]*?)\\section/i);
  if (summaryMatch) {
    summary = summaryMatch[1].replace(/\\[a-zA-Z]+(\[[^\]]*\])?(\{([^}]*)\})?/g, '$3').replace(/[\r\n\t]+/g, ' ').trim();
  }

  // Extract Experience items
  const experience: ResumeExperience[] = [];
  const expSectionMatch = texContent.match(/\\section\{EXPERIENCE\}([\s\S]*?)(\\section|$)/i);
  if (expSectionMatch) {
    const expText = expSectionMatch[1];
    const jobBlocks = expText.split(/\\noindent\\textbf\{/);
    
    for (const block of jobBlocks) {
      if (!block.trim()) continue;
      const headerEnd = block.indexOf('}');
      if (headerEnd === -1) continue;

      const header = block.substring(0, headerEnd);
      const afterHeader = block.substring(headerEnd);
      
      const dateMatch = afterHeader.match(/\\textit\{([^}]+)\}/);
      const dateStr = dateMatch ? dateMatch[1] : '';

      const items: string[] = [];
      const itemRegex = /\\item\s+([^\n\\]+)/g;
      let m;
      while ((m = itemRegex.exec(afterHeader)) !== null) {
        const cleanItem = m[1].replace(/\\textbf\{([^}]+)\}/g, '$1').replace(/\\texttt\{([^}]+)\}/g, '$1').trim();
        if (cleanItem) items.push(cleanItem);
      }

      const parts = header.split(/[–—\-]/).map(s => s.trim());
      experience.push({
        id: `exp-${Date.now()}-${experience.length}`,
        company: parts[0] || 'Enterprise',
        role: parts[1] || 'Consultant',
        startDate: dateStr.split(/[–—\-]/)[0]?.trim() || '2022',
        endDate: dateStr.split(/[–—\-]/)[1]?.trim() || 'Present',
        location: 'Bengaluru, India',
        highlights: items.length > 0 ? items : ['Delivered mission-critical software capabilities.']
      });
    }
  }

  // Extract Education
  const education: ResumeEducation[] = [];
  const eduSectionMatch = texContent.match(/\\section\{EDUCATION\}([\s\S]*?)(\\section|$)/i);
  if (eduSectionMatch) {
    const eduText = eduSectionMatch[1];
    const instMatch = eduText.match(/\\noindent\\textbf\{([^}]+)\}/);
    const degreeMatch = eduText.match(/\\textit\{([^}]+)\}/);
    if (instMatch) {
      education.push({
        id: `edu-tex-1`,
        institution: instMatch[1].trim(),
        degree: degreeMatch ? degreeMatch[1].trim() : 'Bachelor of Engineering',
        year: '2017'
      });
    }
  }

  // Extract Skills
  const skills: ResumeSkillCategory[] = [];
  const skillSectionMatch = texContent.match(/\\section\{Profile Summary\}[\s\S]*?\\begin\{multicols\}[\s\S]*?\\end\{multicols\}/i);
  if (skillSectionMatch) {
    const itemRegex = /\\item\s+([^\n\\]+)/g;
    const items: string[] = [];
    let m;
    while ((m = itemRegex.exec(skillSectionMatch[0])) !== null) {
      items.push(m[1].replace(/\\texttt\{([^}]+)\}/g, '$1').trim());
    }
    if (items.length > 0) {
      skills.push({ category: "Core Technologies", items: items.join(', ') });
    }
  }

  return {
    basics: {
      name: name || PRESET_PROFILES.sureshKumar.data.basics.name,
      title: title || PRESET_PROFILES.sureshKumar.data.basics.title,
      email: contact.email || PRESET_PROFILES.sureshKumar.data.basics.email,
      phone: contact.phone || PRESET_PROFILES.sureshKumar.data.basics.phone,
      location: "Bengaluru, Karnataka, India",
      website: contact.website || PRESET_PROFILES.sureshKumar.data.basics.website,
      linkedin: contact.linkedin || PRESET_PROFILES.sureshKumar.data.basics.linkedin,
      github: contact.github || PRESET_PROFILES.sureshKumar.data.basics.github,
      summary: summary || PRESET_PROFILES.sureshKumar.data.basics.summary
    },
    skills: skills.length > 0 ? skills : PRESET_PROFILES.sureshKumar.data.skills,
    experience: experience.length > 0 ? experience : PRESET_PROFILES.sureshKumar.data.experience,
    education: education.length > 0 ? education : PRESET_PROFILES.sureshKumar.data.education,
    projects: PRESET_PROFILES.sureshKumar.data.projects
  };
}

/**
 * Standard JSON Resume (jsonresume.org & resume_data.json) Parser
 */
export function parseJsonResume(jsonString: string): ResumeData {
  const parsed = JSON.parse(jsonString);

  // If already matches ResumeData schema
  if (parsed.basics && parsed.experience) {
    return parsed as ResumeData;
  }

  // Standard jsonresume.org schema mapping
  const basics = parsed.basics || {};
  const contact = parsed.contact || {};
  const work = parsed.work || parsed.experience || [];
  const education = parsed.education || [];
  const skills = parsed.skills || [];
  const projects = parsed.projects || [];

  return {
    basics: {
      name: basics.name || parsed.name || 'Professional Name',
      title: basics.label || basics.title || parsed.title || 'Software Architect',
      email: basics.email || contact.email || '',
      phone: basics.phone || contact.phone || '',
      location: basics.location?.city ? `${basics.location.city}, ${basics.location.region || ''}` : (contact.address?.[0] || 'Bengaluru, India'),
      website: basics.url || basics.website || '',
      linkedin: basics.profiles?.find((p: any) => p.network?.toLowerCase().includes('linkedin'))?.url || '',
      github: basics.profiles?.find((p: any) => p.network?.toLowerCase().includes('github'))?.url || '',
      summary: basics.summary || parsed.overview?.[0] || parsed.raw_text_dump?.slice(0, 300) || ''
    },
    skills: skills.length > 0 ? (
      typeof skills[0] === 'string'
        ? [{ category: 'Technical Skills', items: skills.join(', ') }]
        : skills.map((s: any) => ({
            category: s.name || s.category || 'General',
            items: Array.isArray(s.keywords) ? s.keywords.join(', ') : (s.items || '')
          }))
    ) : PRESET_PROFILES.sureshKumar.data.skills,
    experience: work.map((w: any, idx: number) => ({
      id: w.id || `exp-json-${idx}`,
      company: w.company || w.name || 'Company',
      role: w.position || w.role || 'Engineer',
      startDate: w.startDate || '2021',
      endDate: w.endDate || 'Present',
      location: w.location || 'Remote',
      highlights: Array.isArray(w.highlights) ? w.highlights : (w.summary ? [w.summary] : ['Key deliverables completed.'])
    })),
    education: education.map((e: any, idx: number) => ({
      id: e.id || `edu-json-${idx}`,
      institution: e.institution || 'University',
      degree: e.studyType ? `${e.studyType} in ${e.area || ''}` : (e.degree || 'Bachelor Degree'),
      year: e.endDate ? `${e.startDate ? e.startDate + ' – ' : ''}${e.endDate}` : (e.year || '2019'),
      honors: e.score || e.honors || ''
    })),
    projects: projects.map((p: any, idx: number) => ({
      id: p.id || `proj-json-${idx}`,
      title: p.name || p.title || 'Project',
      techStack: Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.techStack || ''),
      description: p.description || '',
      link: p.url || p.link || ''
    }))
  };
}

