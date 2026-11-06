import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  Code2, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit2, 
  User, 
  Printer, 
  RefreshCw, 
  FileCode,
  Layers,
  ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';
import { ToolCommonProps } from './types';

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
  skills: {
    category: string;
    items: string;
  }[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
}

const DEFAULT_RESUME: ResumeData = {
  basics: {
    name: "Suresh Kumar",
    title: "Senior Consultant & Systems Architect",
    email: "suresh@sutharlabs.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    website: "https://www.sutharlabs.com",
    linkedin: "https://linkedin.com/in/suresh-kumar",
    github: "https://github.com/SutharLabs",
    summary: "Senior Systems Engineer with 8+ years of expertise in high-performance distributed systems, Model Context Protocol (MCP) tooling, VoIP & telecom architectures (SIP, RTP, SBC), and sovereign enterprise software. Passionate about building resilient developer engines, autonomous trading pipelines, and multi-tenant architectures."
  },
  skills: [
    { category: "Languages & Frameworks", items: "C, C++, Python, TypeScript, React, Node.js, Go, MATLAB, Shell/Bash" },
    { category: "Systems & Protocols", items: "Embedded Linux, Linux Kernel internals, SIP, RTP/SRTP, CAN Protocol, SDP, WebRTC, ECU Simulation" },
    { category: "Architecture & Tools", items: "Model Context Protocol (MCP), Docker, PostgreSQL, SQLite, Pandoc, LaTeX, Wireshark, JIRA, Jenkins" },
    { category: "Open Source Tooling", items: "Tesseract OCR, Asterisk, OpenSIPS, Mediastreamer, Kokoro-82M TTS, WebAssembly" }
  ],
  experience: [
    {
      id: 'exp-1',
      company: "Capgemini Engineering",
      role: "Senior Consultant (C1)",
      startDate: "April 2025",
      endDate: "Present",
      location: "Bengaluru, India",
      highlights: [
        "Architected an enterprise Model Context Protocol (MCP) server for JIRA & telemetry pipelines, automating issue triage workflows in IDEs.",
        "Engineered autonomous AI incident triage multi-agent workflows that inspect server crashes and stack traces, reducing manual MTTD by 60%.",
        "Implemented ENUM SRV load balancing and carrier failover routing across distributed Session Border Controller (SBC) nodes.",
        "Resolved non-compliant SDP answer resource leakage on VoIP trunks with RTP to SRTP dynamic escalation."
      ]
    },
    {
      id: 'exp-2',
      company: "Infosys Ltd",
      role: "Technology Analyst / Senior Systems Engineer",
      startDate: "2019",
      endDate: "2024",
      location: "Bengaluru, India",
      highlights: [
        "Developed carrier-grade Media Gateway (GSX) and Policy Server (PSX) C++ communication daemons handling millions of daily SIP/ISUP transactions.",
        "Managed remote cloud computing nodes, high-availability telemetry daemons, and automated diagnostic toolchains on Linux.",
        "Authored automated regression testbeds for SIP session establishment, PSTN bridging, and call trace inspection."
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: "Visvesvaraya Technological University",
      degree: "Bachelor of Engineering in Computer Science & Engineering",
      year: "2015 – 2019",
      honors: "First Class with Distinction"
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: "Sovereign Engine Platform",
      techStack: "TypeScript, React, Node.js, WebAssembly, SQLite, PostgreSQL",
      description: "Full-stack cloud developer operating system with in-browser zero-knowledge document tools, autonomous trading simulator, and Indian GST accounting engine.",
      link: "https://www.sutharlabs.com"
    },
    {
      id: 'proj-2',
      title: "JIRA Model Context Protocol (MCP) Server",
      techStack: "Python, FastMCP, REST API, JSON-RPC",
      description: "Open-source developer tool exposing enterprise JIRA ticket search, sprint telemetry, and AI issue triage to Claude and Gemini agent sandboxes."
    }
  ]
};

export default function ResumeBuilderTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME);
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'education' | 'skills' | 'projects'>('basics');
  const [themeStyle, setThemeStyle] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  
  const resumePrintRef = useRef<HTMLDivElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  // 1. Export: LaTeX (.tex)
  const generateLatex = (): string => {
    const { basics, skills, experience, education, projects } = resume;
    const cleanTex = (str: string) => str
      .replace(/\\/g, '\\textbackslash ')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}');

    return `\\documentclass[a4paper,10pt]{article}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{multicol}
\\usepackage{ragged2e}

\\geometry{margin=0.75in}
\\setlength{\\parindent}{0pt}

% Theme Colors
\\definecolor{sectioncolor}{HTML}{1E3A8A}
\\definecolor{subsectioncolor}{HTML}{2563EB}
\\definecolor{accentcolor}{HTML}{00838F}

\\titleformat{\\section}[block]{\\normalfont\\bfseries\\color{sectioncolor}\\raggedright}{}{0em}{}[\\vspace{1mm}\\titlerule]
\\titleformat{\\subsection}[runin]{\\bfseries\\color{subsectioncolor}}{}{0em}{}

\\hypersetup{
    colorlinks=true,
    linkcolor=subsectioncolor,
    urlcolor=accentcolor
}

\\AtBeginDocument{\\sloppy}
\\AtBeginDocument{\\justifying}

\\begin{document}

{\\noindent \\LARGE\\textbf{${cleanTex(basics.name)}}}\\par
\\vspace{3pt}
{\\color{sectioncolor}\\large \\textbf{${cleanTex(basics.title)}}}\\par
\\vspace{4pt}
\\textit{${cleanTex(basics.location)} $\\cdot$ ${cleanTex(basics.phone)} $\\cdot$ \\href{mailto:${basics.email}}{${cleanTex(basics.email)}}}
${basics.website ? `\\par\\textit{\\href{${basics.website}}{${cleanTex(basics.website)}}} $\\cdot$ \\textit{\\href{${basics.linkedin}}{${cleanTex(basics.linkedin || '')}}}` : ''}

\\vspace{8pt}
\\section{Professional Summary}
\\vspace{3pt}
${cleanTex(basics.summary)}

\\vspace{8pt}
\\section{Technical Skills}
\\vspace{3pt}
\\begin{itemize}[left=0pt,noitemsep]
${skills.map(s => `  \\item \\textbf{${cleanTex(s.category)}:} ${cleanTex(s.items)}`).join('\n')}
\\end{itemize}

\\vspace{8pt}
\\section{Professional Experience}
${experience.map(exp => `
\\vspace{4pt}
\\noindent\\textbf{${cleanTex(exp.company)}} -- \\textbf{${cleanTex(exp.role)}} \\hfill \\textit{${cleanTex(exp.startDate)} -- ${cleanTex(exp.endDate)}}
\\begin{itemize}[left=10pt,topsep=2pt,itemsep=2pt]
${exp.highlights.map(h => `  \\item ${cleanTex(h)}`).join('\n')}
\\end{itemize}`).join('\n')}

\\vspace{8pt}
\\section{Key Projects}
${projects.map(proj => `
\\vspace{3pt}
\\noindent\\textbf{${cleanTex(proj.title)}} ${proj.link ? `(\\href{${proj.link}}{${cleanTex(proj.link)}})` : ''} \\hfill \\textit{${cleanTex(proj.techStack)}}
\\begin{itemize}[left=10pt,topsep=2pt]
  \\item ${cleanTex(proj.description)}
\\end{itemize}`).join('\n')}

\\vspace{8pt}
\\section{Education}
\\vspace{3pt}
${education.map(edu => `\\noindent\\textbf{${cleanTex(edu.degree)}} \\hfill \\textit{${cleanTex(edu.year)}}\\\\
${cleanTex(edu.institution)} ${edu.honors ? `$\\cdot$ \\textit{${cleanTex(edu.honors)}}` : ''}\\par\\vspace{2pt}`).join('\n')}

\\end{document}
`;
  };

  // 2. Export: Plain Text (.txt)
  const generatePlainText = (): string => {
    const { basics, skills, experience, education, projects } = resume;
    const divider = "================================================================================";
    const subDivider = "--------------------------------------------------------------------------------";

    let text = `${basics.name.toUpperCase()}\n${basics.title}\n`;
    text += `${basics.email} | ${basics.phone} | ${basics.location}\n`;
    if (basics.website) text += `${basics.website} | ${basics.linkedin || ''}\n`;
    text += `\n${divider}\nPROFESSIONAL SUMMARY\n${divider}\n${basics.summary}\n\n`;

    text += `${divider}\nTECHNICAL SKILLS\n${divider}\n`;
    skills.forEach(s => {
      text += `* ${s.category}: ${s.items}\n`;
    });

    text += `\n${divider}\nPROFESSIONAL EXPERIENCE\n${divider}\n`;
    experience.forEach(exp => {
      text += `\n${exp.role} | ${exp.company} | ${exp.location}\n${exp.startDate} - ${exp.endDate}\n`;
      exp.highlights.forEach(h => {
        text += `  - ${h}\n`;
      });
    });

    text += `\n${divider}\nKEY PROJECTS\n${divider}\n`;
    projects.forEach(p => {
      text += `* ${p.title} (${p.techStack})\n  ${p.description}\n`;
      if (p.link) text += `  Link: ${p.link}\n`;
    });

    text += `\n${divider}\nEDUCATION\n${divider}\n`;
    education.forEach(edu => {
      text += `* ${edu.degree}\n  ${edu.institution} (${edu.year}) ${edu.honors ? `- ${edu.honors}` : ''}\n`;
    });

    return text;
  };

  // 3. Export: Microsoft Word (.docx)
  const handleDownloadDocx = async () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    setIsProcessing(true);
    setStatus('Assembling native Microsoft Word (.docx) OpenXML package...');

    try {
      const zip = new JSZip();
      const { basics, skills, experience, education, projects } = resume;

      // Escape XML characters
      const x = (str: string) => (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      // OpenXML Standard Boilerplates
      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

      let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
  <!-- Header: Name & Title -->
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1E3A8A"/></w:rPr><w:t>${x(basics.name)}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2563EB"/></w:rPr><w:t>${x(basics.title)}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>${x(basics.location)}  |  ${x(basics.phone)}  |  ${x(basics.email)}</w:t></w:r></w:p>
  ${basics.website ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="00838F"/></w:rPr><w:t>${x(basics.website)}  |  ${x(basics.linkedin || '')}</w:t></w:r></w:p>` : ''}
  <w:p/>

  <!-- Professional Summary -->
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PROFESSIONAL SUMMARY</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${x(basics.summary)}</w:t></w:r></w:p>
  <w:p/>

  <!-- Skills -->
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>TECHNICAL SKILLS</w:t></w:r></w:p>
`;

      skills.forEach(s => {
        docXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${x(s.category)}: </w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${x(s.items)}</w:t></w:r></w:p>`;
      });

      docXml += `<w:p/><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PROFESSIONAL EXPERIENCE</w:t></w:r></w:p>`;

      experience.forEach(exp => {
        docXml += `
  <w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="2563EB"/></w:rPr><w:t>${x(exp.role)}</w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>  —  ${x(exp.company)} (${x(exp.location)})</w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>  [${x(exp.startDate)} - ${x(exp.endDate)}]</w:t></w:r></w:p>`;
        exp.highlights.forEach(h => {
          docXml += `<w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>   •  ${x(h)}</w:t></w:r></w:p>`;
        });
        docXml += `<w:p/>`;
      });

      docXml += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>KEY PROJECTS</w:t></w:r></w:p>`;
      projects.forEach(p => {
        docXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${x(p.title)} </w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="00838F"/></w:rPr><w:t>(${x(p.techStack)})</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>   ${x(p.description)}</w:t></w:r></w:p>`;
      });

      docXml += `<w:p/><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>EDUCATION</w:t></w:r></w:p>`;
      education.forEach(edu => {
        docXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${x(edu.degree)}</w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t> (${x(edu.year)})</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${x(edu.institution)} ${edu.honors ? ` — ${x(edu.honors)}` : ''}</w:t></w:r></w:p>`;
      });

      docXml += `</w:body></w:document>`;
      zip.folder('word')?.file('document.xml', docXml);

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus('Successfully downloaded editable Word document (.docx)!');
      addLog?.('SUCCESS', 'Exported Microsoft Word resume document (.docx).');
    } catch (err: any) {
      setError?.(`Word export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Export: PDF (via browser print / PDF export)
  const handlePrintPdf = () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    window.print();
  };

  // 5. Download File Helper (LaTeX, Text, JSON)
  const downloadTextFile = (content: string, filename: string, mime: string) => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${filename}!`);
    addLog?.('SUCCESS', `Exported ${filename}`);
  };

  // Import JSON or Text
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.basics || parsed.name) {
            // Normalize JSON Resume schema or resume_data.json
            const normalized: ResumeData = {
              basics: {
                name: parsed.basics?.name || parsed.name || 'User',
                title: parsed.basics?.title || parsed.title || 'Professional',
                email: parsed.basics?.email || parsed.contact?.email || '',
                phone: parsed.basics?.phone || parsed.contact?.phone || '',
                location: parsed.basics?.location || parsed.contact?.address?.join(', ') || '',
                website: parsed.basics?.website || '',
                linkedin: parsed.basics?.linkedin || '',
                github: parsed.basics?.github || '',
                summary: parsed.basics?.summary || parsed.overview?.[0] || parsed.raw_text_dump?.slice(0, 300) || ''
              },
              skills: parsed.skills?.length > 0 ? (
                typeof parsed.skills[0] === 'string'
                  ? [{ category: 'General', items: parsed.skills.join(', ') }]
                  : parsed.skills
              ) : DEFAULT_RESUME.skills,
              experience: parsed.experience?.length > 0 ? parsed.experience : DEFAULT_RESUME.experience,
              education: parsed.education?.length > 0 ? parsed.education : DEFAULT_RESUME.education,
              projects: parsed.projects?.length > 0 ? parsed.projects : DEFAULT_RESUME.projects
            };
            setResume(normalized);
            setStatus(`Successfully loaded resume from ${file.name}!`);
            addLog?.('SUCCESS', `Imported resume data from ${file.name}`);
          }
        } else {
          // Plaintext import
          setResume(prev => ({
            ...prev,
            basics: {
              ...prev.basics,
              summary: text.slice(0, 1000)
            }
          }));
          setStatus(`Imported text content into summary.`);
        }
      } catch (err: any) {
        setError?.(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Quick helper to copy formatted code
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Hidden File Input for Import */}
      <input 
        ref={fileImportRef} 
        type="file" 
        accept=".json,.txt,.tex" 
        onChange={handleImportFile} 
        className="hidden" 
      />

      {/* Top Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-on-surface">
              Sovereign Resume &amp; CV Studio
            </h2>
            <p className="text-[11px] text-on-surface-variant font-mono">
              Build ATS-friendly resumes with 4-Format Export: PDF, Microsoft Word (.docx), LaTeX (.tex) &amp; Plain Text
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto">
          <button
            type="button"
            onClick={handlePrintPdf}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
            title="Export Vector PDF via Print Dialog"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none transition-all"
            title="Download Microsoft Word .docx"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={() => downloadTextFile(generateLatex(), `${resume.basics.name.replace(/\s+/g, '_')}.tex`, 'application/x-tex')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}
            title="Download LaTeX compile-ready source (.tex)"
          >
            <FileCode className="w-3.5 h-3.5 shrink-0" />
            <span>LaTeX (.tex)</span>
          </button>

          <button
            type="button"
            onClick={() => downloadTextFile(generatePlainText(), `${resume.basics.name.replace(/\s+/g, '_')}.txt`, 'text/plain')}
            className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1 transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
            title="Download Plain Text for ATS forms"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => downloadTextFile(JSON.stringify(resume, null, 2), `${resume.basics.name.replace(/\s+/g, '_')}_data.json`, 'application/json')}
            className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1 transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
            title="Save JSON Resume Schema"
          >
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Template Switcher & Import */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant">Template Style:</span>
          <div className={`flex rounded-lg p-0.5 border text-[11px] ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
          }`}>
            {(['modern', 'classic', 'minimal'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setThemeStyle(t)}
                className={`px-3 py-1 rounded-md font-mono capitalize cursor-pointer transition-all ${
                  themeStyle === t
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResume(DEFAULT_RESUME)}
            className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 shrink-0" />
            <span>Load Sample Profile</span>
          </button>

          <span className="text-on-surface-variant/40">•</span>

          <button
            type="button"
            onClick={() => fileImportRef.current?.click()}
            className="text-[11px] font-mono text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <FolderGit2 className="w-3 h-3 shrink-0" />
            <span>Import JSON / Text</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface: Editor (Left) & Real-time Live A4 Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Section Form Tabs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Navigation Tabs */}
          <div className={`flex flex-wrap rounded-xl p-1 border gap-1 text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'
          }`}>
            {[
              { id: 'basics', label: 'Profile', icon: User },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'skills', label: 'Skills', icon: Wrench },
              { id: 'projects', label: 'Projects', icon: FolderGit2 },
              { id: 'education', label: 'Education', icon: GraduationCap }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? isLight
                      ? 'bg-white text-sky-600 shadow-sm border border-slate-200'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content Panel */}
          <div className={`p-4 rounded-xl border space-y-4 text-xs ${
            isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-black/10 border-white/5'
          }`}>
            {/* 1. Basics Tab */}
            {activeTab === 'basics' && (
              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resume.basics.name}
                    onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, name: e.target.value } })}
                    className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Role / Target Title</label>
                  <input
                    type="text"
                    value={resume.basics.title}
                    onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, title: e.target.value } })}
                    className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Email</label>
                    <input
                      type="email"
                      value={resume.basics.email}
                      onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, email: e.target.value } })}
                      className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Phone</label>
                    <input
                      type="text"
                      value={resume.basics.phone}
                      onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, phone: e.target.value } })}
                      className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={resume.basics.location}
                    onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, location: e.target.value } })}
                    className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Portfolio / Website</label>
                  <input
                    type="text"
                    value={resume.basics.website || ''}
                    onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, website: e.target.value } })}
                    className={`w-full h-8 px-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={resume.basics.summary}
                    onChange={(e) => setResume({ ...resume, basics: { ...resume.basics, summary: e.target.value } })}
                    className={`w-full p-2 rounded-lg border text-xs leading-relaxed ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* 2. Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface">Work Positions ({resume.experience.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newExp: ResumeExperience = {
                        id: `exp-${Date.now()}`,
                        company: 'Company Name',
                        role: 'Role Title',
                        startDate: '2023',
                        endDate: 'Present',
                        location: 'City, Country',
                        highlights: ['Accomplished milestone delivering measurable outcomes.']
                      };
                      setResume({ ...resume, experience: [newExp, ...resume.experience] });
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Add Position</span>
                  </button>
                </div>

                {resume.experience.map((exp, idx) => (
                  <div key={exp.id} className={`p-3 rounded-xl border space-y-2.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#18181d] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sky-400">Position #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setResume({ ...resume, experience: resume.experience.filter(e => e.id !== exp.id) })}
                        className="text-rose-400 hover:text-rose-500 cursor-pointer"
                        title="Delete Position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].company = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className={`h-7 px-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].role = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className={`h-7 px-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].startDate = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className={`h-7 px-2 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].endDate = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className={`h-7 px-2 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].location = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className={`h-7 px-2 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block">Key Accomplishments (One per line)</label>
                      <textarea
                        rows={3}
                        value={exp.highlights.join('\n')}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[idx].highlights = e.target.value.split('\n').filter(Boolean);
                          setResume({ ...resume, experience: updated });
                        }}
                        placeholder="Type bullet achievements here..."
                        className={`w-full p-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface">Skill Categories ({resume.skills.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResume({
                        ...resume,
                        skills: [...resume.skills, { category: 'Tools & DevOps', items: 'Git, Docker, Linux, CI/CD' }]
                      });
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Add Category</span>
                  </button>
                </div>

                {resume.skills.map((skill, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border space-y-1.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#18181d] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={skill.category}
                        onChange={(e) => {
                          const updated = [...resume.skills];
                          updated[idx].category = e.target.value;
                          setResume({ ...resume, skills: updated });
                        }}
                        className={`h-7 px-2 font-bold rounded border text-xs flex-1 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10 text-sky-400'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setResume({ ...resume, skills: resume.skills.filter((_, i) => i !== idx) })}
                        className="text-rose-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={skill.items}
                      onChange={(e) => {
                        const updated = [...resume.skills];
                        updated[idx].items = e.target.value;
                        setResume({ ...resume, skills: updated });
                      }}
                      className={`w-full p-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 4. Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface">Projects ({resume.projects.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newProj: ResumeProject = {
                        id: `proj-${Date.now()}`,
                        title: 'Project Name',
                        techStack: 'Python, TypeScript, SQLite',
                        description: 'Detailed description of architectural design and impact.',
                        link: 'https://github.com/example'
                      };
                      setResume({ ...resume, projects: [newProj, ...resume.projects] });
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Add Project</span>
                  </button>
                </div>

                {resume.projects.map((proj, idx) => (
                  <div key={proj.id} className={`p-3 rounded-xl border space-y-2 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#18181d] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[idx].title = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className={`h-7 px-2 font-bold rounded border text-xs flex-1 mr-2 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10 text-sky-400'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setResume({ ...resume, projects: resume.projects.filter(p => p.id !== proj.id) })}
                        className="text-rose-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tech Stack (e.g. Python, React)"
                        value={proj.techStack}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[idx].techStack = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className={`h-7 px-2 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <input
                        type="text"
                        placeholder="Live URL / Repository"
                        value={proj.link || ''}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[idx].link = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className={`h-7 px-2 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Project description and key deliverables..."
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...resume.projects];
                        updated[idx].description = e.target.value;
                        setResume({ ...resume, projects: updated });
                      }}
                      className={`w-full p-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 5. Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface">Education Entries ({resume.education.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newEdu: ResumeEducation = {
                        id: `edu-${Date.now()}`,
                        institution: 'University Name',
                        degree: 'Bachelor of Science in Computer Science',
                        year: '2018 – 2022',
                        honors: 'Distinction'
                      };
                      setResume({ ...resume, education: [...resume.education, newEdu] });
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Add Degree</span>
                  </button>
                </div>

                {resume.education.map((edu, idx) => (
                  <div key={edu.id} className={`p-3 rounded-xl border space-y-2 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#18181d] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Degree / Major"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[idx].degree = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className={`h-7 px-2 font-bold rounded border text-xs flex-1 mr-2 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setResume({ ...resume, education: resume.education.filter(ed => ed.id !== edu.id) })}
                        className="text-rose-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Institution / School"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[idx].institution = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className={`h-7 px-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <input
                        type="text"
                        placeholder="Year (e.g. 2015 – 2019)"
                        value={edu.year}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[idx].year = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className={`h-7 px-2 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Live A4 Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-on-surface-variant font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>A4 Document Real-Time Preview</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(generateLatex(), 'tex')}
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'tex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'tex' ? 'Copied TeX' : 'Copy TeX'}</span>
              </button>
              <span className="text-on-surface-variant/40">•</span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatePlainText(), 'txt')}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'txt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'txt' ? 'Copied Text' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Paper Container */}
          <div 
            ref={resumePrintRef}
            className={`w-full rounded-2xl border shadow-xl p-6 sm:p-10 font-sans transition-all select-all ${
              themeStyle === 'modern'
                ? 'bg-white text-slate-800 border-slate-300 shadow-slate-900/10'
                : themeStyle === 'classic'
                  ? 'bg-[#fafafa] text-slate-900 border-slate-300 font-serif'
                  : 'bg-white text-slate-900 border-slate-300 font-mono text-[11px]'
            }`}
          >
            {/* Header: Name, Title & Contacts */}
            <div className="border-b border-slate-200 pb-4 mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
                {resume.basics.name}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-sky-600 mt-0.5">
                {resume.basics.title}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2 font-mono">
                <span>{resume.basics.location}</span>
                <span>•</span>
                <span>{resume.basics.phone}</span>
                <span>•</span>
                <span className="text-sky-600">{resume.basics.email}</span>
                {resume.basics.website && (
                  <>
                    <span>•</span>
                    <a href={resume.basics.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      {resume.basics.website.replace(/^https?:\/\//, '')}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Professional Summary
              </h2>
              <p className="text-xs leading-relaxed text-slate-700">
                {resume.basics.summary}
              </p>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Technical Skills
              </h2>
              <div className="space-y-1 text-xs">
                {resume.skills.map((s, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="font-bold text-slate-900">{s.category}: </span>
                    <span className="text-slate-700">{s.items}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div className="mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Professional Experience
              </h2>
              <div className="space-y-3">
                {resume.experience.map(exp => (
                  <div key={exp.id} className="text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 font-bold text-slate-900">
                      <span>{exp.role} — <span className="text-sky-700">{exp.company}</span></span>
                      <span className="text-[11px] font-mono text-slate-500 font-normal">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mb-1">{exp.location}</div>
                    <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700 text-xs">
                      {exp.highlights.map((h, i) => (
                        <li key={i} className="leading-relaxed">{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Key Projects &amp; Architectures
              </h2>
              <div className="space-y-2">
                {resume.projects.map(proj => (
                  <div key={proj.id} className="text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{proj.title} <span className="text-sky-700 font-normal text-[11px]">({proj.techStack})</span></span>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-sky-600 hover:underline">
                          View ↗
                        </a>
                      )}
                    </div>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Education
              </h2>
              <div className="space-y-1.5 text-xs">
                {resume.education.map(edu => (
                  <div key={edu.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree}</span>
                      <span className="text-slate-600 block text-[11px]">{edu.institution} {edu.honors ? `• ${edu.honors}` : ''}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

