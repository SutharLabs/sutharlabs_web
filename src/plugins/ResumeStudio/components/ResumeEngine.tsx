import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  FileSpreadsheet,
  Terminal,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  ResumeData, 
  PRESET_PROFILES, 
  parseDocx, 
  parsePdf, 
  parseTex, 
  parsePlainText, 
  parseJsonResume 
} from '../utils/resumeParser.js';
import ConfirmModal, { ModalVariant } from '../../../components/ConfirmModal.js';

interface ResumeEngineProps {
  isLight: boolean;
  theme?: 'light' | 'dark';
  onAddLog?: (log: any) => void;
  checkDownloadAccess?: () => boolean;
}

type InputMode = 'FORM' | 'FILE_IMPORT' | 'SCRATCHPAD' | 'LATEX_CODE' | 'JSON_CODE' | 'PRESETS';
type FormSubTab = 'basics' | 'experience' | 'skills' | 'education' | 'projects';
type TemplateStyle = 'modern' | 'classic' | 'minimal';

export default function ResumeEngine({
  isLight,
  theme = 'dark',
  onAddLog,
  checkDownloadAccess
}: ResumeEngineProps) {
  const [resume, setResume] = useState<ResumeData>(PRESET_PROFILES.sureshKumar.data);
  const [inputMode, setInputMode] = useState<InputMode>('FORM');
  const [formSubTab, setFormSubTab] = useState<FormSubTab>('basics');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('modern');
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  
  // Status and logs
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Scratchpad raw text state
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // Live Code Editors State
  const [latexCode, setLatexCode] = useState<string>('');
  const [jsonCode, setJsonCode] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importedFileInfo, setImportedFileInfo] = useState<{ name: string; size: string; type: string } | null>(null);

  // Modal dialog config
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewPrintRef = useRef<HTMLDivElement>(null);

  const addLogSafe = (type: 'INFO' | 'SUCCESS' | 'ERROR', message: string) => {
    if (onAddLog) {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type,
        message: `[ResumeStudio] ${message}`
      });
    }
  };

  // Sync raw code strings when resume data changes
  useEffect(() => {
    setJsonCode(JSON.stringify(resume, null, 2));
    setLatexCode(generateLatexDocument(resume));
  }, [resume]);

  // ==========================================
  // EXPORT BUILDERS
  // ==========================================

  function generateLatexDocument(data: ResumeData): string {
    const { basics, skills, experience, education, projects } = data;
    const cleanTex = (str: string) => (str || '')
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

\\geometry{margin=0.85in}
\\setlength{\\parindent}{0pt}

% Palette
\\definecolor{primary}{HTML}{1E3A8A}
\\definecolor{secondary}{HTML}{2563EB}
\\definecolor{textdark}{HTML}{1F2937}

\\titleformat{\\section}[block]{\\normalfont\\bfseries\\color{primary}\\raggedright}{}{0em}{}[\\vspace{1mm}\\titlerule]
\\hypersetup{colorlinks=true, linkcolor=secondary, urlcolor=secondary}

\\begin{document}

{\\LARGE\\textbf{${cleanTex(basics.name)}}}\\\\
\\vspace{3pt}
{\\large\\textcolor{secondary}{\\textbf{${cleanTex(basics.title)}}}}\\\\
\\vspace{4pt}
{\\small ${cleanTex(basics.location)} \\ $|$ \\ ${cleanTex(basics.phone)} \\ $|$ \\ \\href{mailto:${basics.email}}{${basics.email}}}
${basics.website ? `\\\\{\\small \\href{${basics.website}}{${cleanTex(basics.website)}} ${basics.linkedin ? ` $|$ \\ \\href{${basics.linkedin}}{${cleanTex(basics.linkedin)}}` : ''}}` : ''}

\\vspace{8pt}

\\section{Profile Summary}
\\vspace{3pt}
${cleanTex(basics.summary)}

\\vspace{8pt}

\\section{Technical Skills}
\\vspace{3pt}
\\begin{itemize}[left=0pt, label={}]
${skills.map(s => `  \\item \\textbf{${cleanTex(s.category)}:} ${cleanTex(s.items)}`).join('\n')}
\\end{itemize}

\\vspace{8pt}

\\section{Professional Experience}
${experience.map(exp => `
\\noindent\\textbf{${cleanTex(exp.role)}} \\hfill \\textit{${cleanTex(exp.startDate)} -- ${cleanTex(exp.endDate)}}\\\\
\\textcolor{secondary}{\\textbf{${cleanTex(exp.company)}}} \\hfill \\textit{${cleanTex(exp.location)}}
\\begin{itemize}[left=10pt]
${exp.highlights.map(h => `  \\item ${cleanTex(h)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}`).join('\n')}

\\vspace{4pt}

\\section{Key Projects}
${projects.map(p => `
\\noindent\\textbf{${cleanTex(p.title)}} ${p.techStack ? `\\hfill \\textit{(${cleanTex(p.techStack)})}` : ''}\\\\
${cleanTex(p.description)}
${p.link ? `\\\\{\\small \\href{${p.link}}{${cleanTex(p.link)}}}` : ''}
\\vspace{4pt}`).join('\n')}

\\vspace{4pt}

\\section{Education}
${education.map(edu => `
\\noindent\\textbf{${cleanTex(edu.degree)}} \\hfill \\textit{${cleanTex(edu.year)}}\\\\
${cleanTex(edu.institution)} ${edu.honors ? ` $|$ \\textit{${cleanTex(edu.honors)}}` : ''}
\\vspace{3pt}`).join('\n')}

\\end{document}`;
  }

  function generatePlainText(data: ResumeData): string {
    const { basics, skills, experience, education, projects } = data;
    const divider = '='.repeat(68);
    const subDivider = '-'.repeat(68);

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
      text += `\n${exp.role} | ${exp.company} | ${exp.location}\n${exp.startDate} - ${exp.endDate}\n${subDivider}\n`;
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
  }

  // 1. Export: Word (.docx) via JSZip
  const handleDownloadDocx = async () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    setIsProcessing(true);
    setStatusMessage('Compiling Microsoft Word (.docx) OpenXML document...');

    try {
      const zip = new JSZip();
      const { basics, skills, experience, education, projects } = resume;
      const x = (str: string) => (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

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
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1E3A8A"/></w:rPr><w:t>${x(basics.name)}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2563EB"/></w:rPr><w:t>${x(basics.title)}</w:t></w:r></w:p>
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>${x(basics.location)}  |  ${x(basics.phone)}  |  ${x(basics.email)}</w:t></w:r></w:p>
  ${basics.website ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="00838F"/></w:rPr><w:t>${x(basics.website)}  |  ${x(basics.linkedin || '')}</w:t></w:r></w:p>` : ''}
  <w:p/>
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="1E3A8A"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PROFESSIONAL SUMMARY</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${x(basics.summary)}</w:t></w:r></w:p>
  <w:p/>
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
      a.download = `${(resume.basics.name || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMessage('Successfully downloaded editable Word document (.docx)!');
      addLogSafe('SUCCESS', 'Exported Microsoft Word resume document (.docx).');
    } catch (err: any) {
      setErrorMessage(`Word export failed: ${err.message}`);
      addLogSafe('ERROR', `Word export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Export: PDF (via browser print)
  const handlePrintPdf = () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    window.print();
    addLogSafe('INFO', 'Opened browser PDF print preview dialog.');
  };

  // 3. Download generic file helper
  const downloadTextFile = (content: string, filename: string, mime: string) => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(`Downloaded ${filename}!`);
    addLogSafe('SUCCESS', `Exported ${filename}`);
  };

  const copyToClipboard = (text: string, formatKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatKey);
    setTimeout(() => setCopiedFormat(null), 2000);
    setStatusMessage(`Copied ${formatKey.toUpperCase()} to clipboard!`);
  };

  // ==========================================
  // INPUT INGESTION HANDLERS
  // ==========================================

  const handleIngestFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Ingesting and parsing ${file.name}...`);
    setErrorMessage(null);

    try {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      let parsedData: ResumeData;

      if (ext === '.docx') {
        parsedData = await parseDocx(file);
      } else if (ext === '.pdf') {
        parsedData = await parsePdf(file);
      } else if (ext === '.tex') {
        const text = await file.text();
        parsedData = parseTex(text);
      } else if (ext === '.json') {
        const text = await file.text();
        parsedData = parseJsonResume(text);
      } else {
        // Plaintext or Markdown
        const text = await file.text();
        parsedData = parsePlainText(text);
      }

      setResume(parsedData);
      setImportedFileInfo({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: ext.toUpperCase().replace('.', '')
      });
      setStatusMessage(`Successfully imported and structured ${file.name}!`);
      addLogSafe('SUCCESS', `Ingested ${file.name} (${ext.toUpperCase()}) into resume model.`);
      setInputMode('FORM'); // switch to form view so user can review & edit
    } catch (err: any) {
      setErrorMessage(`Failed to parse file: ${err.message}`);
      addLogSafe('ERROR', `File ingestion error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartParseScratchpad = () => {
    if (!scratchpadText.trim()) {
      setErrorMessage('Please paste resume or LinkedIn text into the scratchpad first.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Running heuristic NLP parsing on scratchpad text...');

    try {
      const parsed = parsePlainText(scratchpadText);
      setResume(parsed);
      setStatusMessage('Successfully extracted profile, experience, and skills from raw text!');
      addLogSafe('SUCCESS', 'Parsed raw scratchpad text into structured resume model.');
      setInputMode('FORM');
    } catch (err: any) {
      setErrorMessage(`Parse error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyLatexCode = () => {
    try {
      const parsed = parseTex(latexCode);
      setResume(parsed);
      setStatusMessage('Successfully updated visual resume from custom LaTeX markup!');
      addLogSafe('SUCCESS', 'Updated resume from raw LaTeX source code.');
      setInputMode('FORM');
    } catch (err: any) {
      setErrorMessage(`LaTeX parse error: ${err.message}`);
    }
  };

  const handleApplyJsonCode = () => {
    try {
      setJsonError(null);
      const parsed = parseJsonResume(jsonCode);
      setResume(parsed);
      setStatusMessage('Successfully applied JSON Resume changes!');
      addLogSafe('SUCCESS', 'Updated resume from direct JSON schema.');
      setInputMode('FORM');
    } catch (err: any) {
      setJsonError(err.message);
      setErrorMessage(`Invalid JSON: ${err.message}`);
    }
  };

  const loadPreset = (presetKey: string) => {
    const p = PRESET_PROFILES[presetKey];
    if (p) {
      setResume(p.data);
      setStatusMessage(`Loaded preset profile: ${p.label}`);
      addLogSafe('INFO', `Switched to preset career profile: ${p.label}`);
      setInputMode('FORM');
    }
  };

  const promptResetResume = () => {
    setModalConfig({
      isOpen: true,
      title: 'Reset Resume Data',
      message: 'Are you sure you want to reset all current resume data to the blank template?',
      subtext: 'Any unsaved changes in this session will be replaced with an empty template.',
      confirmLabel: 'Confirm Reset',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setModalConfig(null);
        setResume(PRESET_PROFILES.blankCanvas.data);
        setStatusMessage('Reset resume to clean blank canvas.');
      }
    });
  };

  // ==========================================
  // FORM EDITING HELPERS
  // ==========================================

  const updateBasics = (field: keyof ResumeData['basics'], val: string) => {
    setResume(prev => ({
      ...prev,
      basics: { ...prev.basics, [field]: val }
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: 'New Company',
      role: 'Software Engineer',
      startDate: '2023',
      endDate: 'Present',
      location: 'Remote',
      highlights: ['Contributed to core architecture and feature delivery.']
    };
    setResume(prev => ({ ...prev, experience: [newExp, ...prev.experience] }));
  };

  const updateExperience = (id: string, field: string, val: any) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, [field]: val } : e)
    }));
  };

  const removeExperience = (id: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter(e => e.id !== id)
    }));
  };

  const addHighlight = (expId: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(e => {
        if (e.id === expId) {
          return { ...e, highlights: [...e.highlights, 'Key technical contribution or impact metric.'] };
        }
        return e;
      })
    }));
  };

  const updateHighlight = (expId: string, idx: number, val: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(e => {
        if (e.id === expId) {
          const updated = [...e.highlights];
          updated[idx] = val;
          return { ...e, highlights: updated };
        }
        return e;
      })
    }));
  };

  const removeHighlight = (expId: string, idx: number) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(e => {
        if (e.id === expId) {
          return { ...e, highlights: e.highlights.filter((_, i) => i !== idx) };
        }
        return e;
      })
    }));
  };

  const addSkillCategory = () => {
    setResume(prev => ({
      ...prev,
      skills: [...prev.skills, { category: 'Tools & Technologies', items: 'Git, Docker, VS Code' }]
    }));
  };

  const updateSkillCategory = (idx: number, field: 'category' | 'items', val: string) => {
    setResume(prev => {
      const updated = [...prev.skills];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, skills: updated };
    });
  };

  const removeSkillCategory = (idx: number) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx)
    }));
  };

  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, {
        id: `edu-${Date.now()}`,
        institution: 'University Name',
        degree: 'Bachelor of Science in Computer Science',
        year: '2019 – 2023',
        honors: 'First Class'
      }]
    }));
  };

  const updateEducation = (id: string, field: string, val: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(ed => ed.id === id ? { ...ed, [field]: val } : ed)
    }));
  };

  const removeEducation = (id: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(ed => ed.id !== id)
    }));
  };

  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: `proj-${Date.now()}`,
        title: 'New High-Impact Project',
        techStack: 'TypeScript, React, Python',
        description: 'Engineered a scalable service supporting high-throughput workloads.',
        link: 'https://github.com/project'
      }]
    }));
  };

  const updateProject = (id: string, field: string, val: string) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: val } : p)
    }));
  };

  const removeProject = (id: string) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  return (
    <div className={`w-full flex flex-col space-y-4`}>
      {/* Universal Top Toolbar & Mode Switcher */}
      <div className={`p-3 sm:p-4 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
      }`}>
        {/* Input Variant Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 lg:pb-0">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mr-1.5 shrink-0 ${
            isLight ? 'text-slate-500' : 'text-gray-400'
          }`}>
            Input Mode:
          </span>

          <button
            type="button"
            onClick={() => setInputMode('FORM')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'FORM'
                ? isLight 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Form GUI</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('FILE_IMPORT')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'FILE_IMPORT'
                ? isLight 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span>File Ingestion</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase ${
              isLight ? 'bg-white/20' : 'bg-white/10'
            }`}>
              DOCX/PDF/TEX
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('SCRATCHPAD')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'SCRATCHPAD'
                ? isLight 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Raw Text Scratchpad</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('LATEX_CODE')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'LATEX_CODE'
                ? isLight 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span>LaTeX Source</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('JSON_CODE')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'JSON_CODE'
                ? isLight 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 shrink-0" />
            <span>JSON Schema</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('PRESETS')}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
              inputMode === 'PRESETS'
                ? isLight 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-[#1c1c22] hover:bg-[#25252e] text-[#a4a2a6] border border-[#3a494b]/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Career Presets</span>
          </button>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isProcessing}
            title="Download editable Microsoft Word OpenXML file (.docx)"
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 select-none ${
              isLight
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 hover:text-white border border-blue-500/40'
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            title="Print or Save vector PDF via browser"
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-white border border-emerald-500/40'
            }`}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>PDF Vector</span>
          </button>

          <button
            type="button"
            onClick={() => downloadTextFile(latexCode, `${(resume.basics.name || 'resume').replace(/\s+/g, '_')}.tex`, 'application/x-tex')}
            title="Download compile-ready LaTeX document (.tex)"
            className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>.tex</span>
          </button>

          <button
            type="button"
            onClick={() => downloadTextFile(generatePlainText(resume), `${(resume.basics.name || 'resume').replace(/\s+/g, '_')}.txt`, 'text/plain')}
            title="Download ATS Plain Text (.txt)"
            className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>.txt</span>
          </button>

          <button
            type="button"
            onClick={promptResetResume}
            title="Clear and reset resume canvas"
            className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isLight ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600' : 'bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Status & Feedback Banners */}
      {statusMessage && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-mono bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="hover:opacity-75 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-mono bg-rose-500/10 border-rose-500/30 text-rose-400 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="hover:opacity-75 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main Split Layout: Editor Viewport (Left) vs Live Vector Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ============================================================== */}
        {/* LEFT VIEWPORT: ACTIVE INPUT VARIANT ENGINE                      */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* VARIANT 1: VISUAL FORM GUI */}
          {inputMode === 'FORM' && (
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-5 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              {/* Form Subtabs */}
              <div className="flex items-center justify-between border-b border-[#3a494b]/20 pb-3">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
                  {(['basics', 'experience', 'skills', 'education', 'projects'] as FormSubTab[]).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFormSubTab(tab)}
                      className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold capitalize transition-all cursor-pointer ${
                        formSubTab === tab
                          ? isLight
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  Auto-syncs in RAM
                </span>
              </div>

              {/* Subtab 1: Basics & Contact */}
              {formSubTab === 'basics' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={resume.basics.name}
                        onChange={(e) => updateBasics('name', e.target.value)}
                        placeholder="e.g. Suresh Kumar"
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-sans ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={resume.basics.title}
                        onChange={(e) => updateBasics('title', e.target.value)}
                        placeholder="e.g. Senior Consultant & Systems Architect"
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-sans ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={resume.basics.email}
                        onChange={(e) => updateBasics('email', e.target.value)}
                        placeholder="name@domain.com"
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Phone
                      </label>
                      <input
                        type="text"
                        value={resume.basics.phone}
                        onChange={(e) => updateBasics('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={resume.basics.location}
                        onChange={(e) => updateBasics('location', e.target.value)}
                        placeholder="Bengaluru, India"
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-sans ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Website / Portfolio
                      </label>
                      <input
                        type="text"
                        value={resume.basics.website || ''}
                        onChange={(e) => updateBasics('website', e.target.value)}
                        placeholder="https://..."
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        value={resume.basics.linkedin || ''}
                        onChange={(e) => updateBasics('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        GitHub URL
                      </label>
                      <input
                        type="text"
                        value={resume.basics.github || ''}
                        onChange={(e) => updateBasics('github', e.target.value)}
                        placeholder="https://github.com/..."
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-mono font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      Executive Summary / Bio
                    </label>
                    <textarea
                      rows={4}
                      value={resume.basics.summary}
                      onChange={(e) => updateBasics('summary', e.target.value)}
                      placeholder="Write a concise overview highlighting your core domain expertise, years of experience, and architectural accomplishments..."
                      className={`w-full p-3 text-xs rounded-xl border outline-none font-sans leading-relaxed ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Subtab 2: Experience */}
              {formSubTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      Work History ({resume.experience.length} Positions)
                    </span>
                    <button
                      type="button"
                      onClick={addExperience}
                      className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer shadow-xs ${
                        isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Add Position</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {resume.experience.map((exp, expIdx) => (
                      <div
                        key={exp.id}
                        className={`p-3.5 rounded-xl border space-y-3 relative group transition-colors ${
                          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/2 border-[#3a494b]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400">
                            Position #{expIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            className="p-1 hover:text-rose-500 text-gray-400 cursor-pointer"
                            title="Remove Position"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                            placeholder="Job Title (e.g. Senior Consultant C1)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-bold ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            placeholder="Company (e.g. Capgemini Engineering)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="Start Date (e.g. April 2025)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder="End Date (e.g. Present)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </div>

                        {/* Bullet Highlights */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                              Key Accomplishments &amp; Bullets ({exp.highlights.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => addHighlight(exp.id)}
                              className="text-[10px] font-mono text-sky-400 hover:underline cursor-pointer"
                            >
                              + Add Bullet
                            </button>
                          </div>

                          {exp.highlights.map((h, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-1.5">
                              <span className="text-sky-500 text-xs mt-1">•</span>
                              <textarea
                                rows={2}
                                value={h}
                                onChange={(e) => updateHighlight(exp.id, hIdx, e.target.value)}
                                className={`flex-1 p-2 text-xs rounded-lg border outline-none font-sans leading-relaxed ${
                                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => removeHighlight(exp.id, hIdx)}
                                className="p-1 hover:text-rose-500 text-gray-400 cursor-pointer mt-1"
                              >
                                <Trash2 className="w-3 h-3 shrink-0" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 3: Skills */}
              {formSubTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      Technical Skill Categories ({resume.skills.length})
                    </span>
                    <button
                      type="button"
                      onClick={addSkillCategory}
                      className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer shadow-xs ${
                        isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {resume.skills.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-2.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                        }`}
                      >
                        <input
                          type="text"
                          value={s.category}
                          onChange={(e) => updateSkillCategory(idx, 'category', e.target.value)}
                          placeholder="Category (e.g. Telecom Protocols)"
                          className={`w-full sm:w-1/3 px-2.5 py-1.5 text-xs rounded-lg border outline-none font-bold ${
                            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                          }`}
                        />
                        <input
                          type="text"
                          value={s.items}
                          onChange={(e) => updateSkillCategory(idx, 'items', e.target.value)}
                          placeholder="Items separated by commas (e.g. SIP, RTP, SBC, OpenSIPS)"
                          className={`flex-1 w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => removeSkillCategory(idx)}
                          className="p-1 hover:text-rose-500 text-gray-400 cursor-pointer self-end sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 4: Education */}
              {formSubTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      Education Credentials ({resume.education.length})
                    </span>
                    <button
                      type="button"
                      onClick={addEducation}
                      className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer shadow-xs ${
                        isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Add Degree</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {resume.education.map((edu) => (
                      <div
                        key={edu.id}
                        className={`p-3 rounded-xl border space-y-2 relative ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Degree (e.g. Bachelor of Engineering)"
                            className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg border outline-none font-bold mr-2 ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            className="p-1 hover:text-rose-500 text-gray-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            placeholder="Institution / University"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                            placeholder="Years (e.g. 2013 – 2017)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 5: Projects */}
              {formSubTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      Portfolio Projects ({resume.projects.length})
                    </span>
                    <button
                      type="button"
                      onClick={addProject}
                      className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer shadow-xs ${
                        isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {resume.projects.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-xl border space-y-2.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => updateProject(p.id, 'title', e.target.value)}
                            placeholder="Project Title"
                            className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg border outline-none font-bold mr-2 ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeProject(p.id)}
                            className="p-1 hover:text-rose-500 text-gray-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={p.techStack}
                            onChange={(e) => updateProject(p.id, 'techStack', e.target.value)}
                            placeholder="Tech Stack (e.g. Python, FastMCP, Docker)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                          <input
                            type="text"
                            value={p.link || ''}
                            onChange={(e) => updateProject(p.id, 'link', e.target.value)}
                            placeholder="Project URL (Optional)"
                            className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={p.description}
                          onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                          placeholder="Project overview, architecture highlights, or metrics..."
                          className={`w-full p-2 text-xs rounded-lg border outline-none font-sans leading-relaxed ${
                            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VARIANT 2: UNIVERSAL FILE INGESTION DROPZONE */}
          {inputMode === 'FILE_IMPORT' && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-5 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Universal Document Ingestion Dropzone</span>
                </h3>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  Decompress and ingest existing CVs directly in RAM. Zero files are uploaded to any server.
                </p>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleIngestFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
                    : isLight
                      ? 'border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/30'
                      : 'border-[#3a494b]/60 hover:border-[#00dbe7]/60 bg-white/2 hover:bg-[#00dbe7]/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight ? 'bg-white border-slate-200 text-sky-600' : 'bg-[#1c1c22] border-[#3a494b]/50 text-[#00dbe7]'
                }`}>
                  <FileCheck2 className="w-6 h-6 shrink-0" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
                    Drag &amp; drop your resume here, or <span className="text-sky-500 underline">browse device</span>
                  </p>
                  <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Supported: Microsoft Word (.docx), PDF (.pdf), LaTeX (.tex), Markdown (.md), Plain Text (.txt), JSON Resume (.json)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.tex,.txt,.md,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIngestFile(file);
                  }}
                  className="hidden"
                />
              </div>

              {importedFileInfo && (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-[#3a494b]/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                      {importedFileInfo.type}
                    </span>
                    <span className="font-bold text-on-surface truncate max-w-[220px]">{importedFileInfo.name}</span>
                    <span className="text-gray-400">({importedFileInfo.size})</span>
                  </div>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5 shrink-0" /> Ingested
                  </span>
                </div>
              )}
            </div>
          )}

          {/* VARIANT 3: RAW UNSTRUCTURED TEXT SCRATCHPAD */}
          {inputMode === 'SCRATCHPAD' && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Smart Text Scratchpad &amp; LinkedIn Parser</span>
                  </h3>
                  <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Paste any unformatted bio, LinkedIn export, or plain text resume. Our regex parser will auto-extract contact, work history, and skills.
                  </p>
                </div>
              </div>

              <textarea
                rows={12}
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Paste unformatted resume text here...&#10;&#10;e.g.&#10;Suresh Kumar&#10;Senior Consultant | mr.sutharsuresh@gmail.com | +91 7304591239&#10;&#10;SUMMARY&#10;8+ years of experience in Telecom Gateway, SIP, RTP, and Linux systems...&#10;&#10;EXPERIENCE&#10;Capgemini Engineering - Senior Consultant (C1) - 2025 to Present&#10;* Architected MCP server for JIRA...&#10;* Added ENUM SRV load balancing..."
                className={`w-full p-3.5 text-xs font-mono rounded-xl border outline-none leading-relaxed select-all ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#101013] border-[#3a494b]/50 text-[#e5e1e4]'
                }`}
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setScratchpadText(generatePlainText(PRESET_PROFILES.sureshKumar.data))}
                  className="text-xs font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  Load sample scratchpad text
                </button>

                <button
                  type="button"
                  onClick={handleSmartParseScratchpad}
                  disabled={isProcessing}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Parse Into Resume</span>
                </button>
              </div>
            </div>
          )}

          {/* VARIANT 4: DIRECT LATEX CODE EDITOR */}
          {inputMode === 'LATEX_CODE' && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Direct LaTeX (.tex) Source Editor</span>
                  </h3>
                  <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Edit raw LaTeX markup directly. Compile-ready for pdflatex, Overleaf, or Pandoc.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latexCode, 'tex')}
                    className="h-7 px-2.5 rounded text-[10px] font-mono border border-[#3a494b]/30 flex items-center gap-1 hover:text-[#00dbe7] cursor-pointer"
                  >
                    {copiedFormat === 'tex' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    <span>{copiedFormat === 'tex' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={14}
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                className={`w-full p-3 text-xs font-mono rounded-xl border outline-none leading-relaxed select-all ${
                  isLight ? 'bg-slate-900 text-emerald-300 border-slate-700' : 'bg-[#0c0c0e] border-[#3a494b]/60 text-emerald-300'
                }`}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyLatexCode}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Apply LaTeX to Resume</span>
                </button>
              </div>
            </div>
          )}

          {/* VARIANT 5: DIRECT JSON SCHEMA EDITOR */}
          {inputMode === 'JSON_CODE' && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Direct JSON Resume Schema Editor</span>
                  </h3>
                  <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Inspect or modify the underlying standard JSON data structure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(jsonCode, 'json')}
                  className="h-7 px-2.5 rounded text-[10px] font-mono border border-[#3a494b]/30 flex items-center gap-1 hover:text-purple-400 cursor-pointer"
                >
                  {copiedFormat === 'json' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                  <span>{copiedFormat === 'json' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {jsonError && (
                <p className="text-xs font-mono text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  Syntax Error: {jsonError}
                </p>
              )}

              <textarea
                rows={14}
                value={jsonCode}
                onChange={(e) => {
                  setJsonCode(e.target.value);
                  setJsonError(null);
                }}
                className={`w-full p-3 text-xs font-mono rounded-xl border outline-none leading-relaxed select-all ${
                  isLight ? 'bg-slate-900 text-sky-300 border-slate-700' : 'bg-[#0c0c0e] border-[#3a494b]/60 text-sky-300'
                }`}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyJsonCode}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Validate &amp; Apply JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* VARIANT 6: CAREER PROFILE PRESETS */}
          {inputMode === 'PRESETS' && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
            }`}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Pre-Configured Career Profiles &amp; Templates</span>
                </h3>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  Quick-load authentic domain profiles extracted from real engineering backgrounds.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(PRESET_PROFILES).map(([key, item]) => (
                  <div
                    key={key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-white/2 hover:bg-white/5 border-[#3a494b]/30'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{item.label}</h4>
                      <p className={`text-[11px] font-sans mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadPreset(key)}
                      className={`h-7 px-3 rounded-lg text-xs font-mono font-bold uppercase shrink-0 cursor-pointer shadow-xs ${
                        key === 'blankCanvas'
                          ? isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          : isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      Load Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT VIEWPORT: LIVE ATS VECTOR RESUME PREVIEW                 */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-3">
          {/* Preview Controls Bar */}
          <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}>
                ATS Style:
              </span>
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                {(['modern', 'classic', 'minimal'] as TemplateStyle[]).map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTemplateStyle(style)}
                    className={`px-2.5 py-1 rounded-md font-mono capitalize cursor-pointer transition-all ${
                      templateStyle === style
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live ATS Parity
              </span>
            </div>
          </div>

          {/* Rendered Document Page Paper */}
          <div 
            ref={previewPrintRef}
            className={`w-full p-6 sm:p-8 rounded-2xl border shadow-lg overflow-hidden transition-all print:p-0 print:border-none print:shadow-none ${
              templateStyle === 'modern'
                ? isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#ffffff] text-slate-900'
                : templateStyle === 'classic'
                  ? 'bg-[#fafaf8] border-amber-200/50 text-slate-900 font-serif'
                  : 'bg-white border-slate-200 text-slate-900'
            }`}
            style={{ minHeight: '650px' }}
          >
            {/* Header: Name, Title & Contact */}
            <header className="border-b-2 border-slate-800 pb-4 mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans uppercase">
                {resume.basics.name || 'Candidate Name'}
              </h1>
              <p className="text-sm font-semibold text-blue-800 font-sans mt-0.5">
                {resume.basics.title || 'Professional Title'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 font-sans mt-2">
                <span>{resume.basics.location}</span>
                <span>•</span>
                <span>{resume.basics.phone}</span>
                <span>•</span>
                <span className="font-medium text-blue-700">{resume.basics.email}</span>
                {resume.basics.website && (
                  <>
                    <span>•</span>
                    <span className="text-teal-700">{resume.basics.website}</span>
                  </>
                )}
                {resume.basics.linkedin && (
                  <>
                    <span>•</span>
                    <span className="text-blue-700">{resume.basics.linkedin}</span>
                  </>
                )}
              </div>
            </header>

            {/* Section: Professional Summary */}
            {resume.basics.summary && (
              <section className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed font-sans text-justify">
                  {resume.basics.summary}
                </p>
              </section>
            )}

            {/* Section: Technical Skills */}
            {resume.skills.length > 0 && (
              <section className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
                  Technical Competencies
                </h2>
                <div className="space-y-1 text-xs font-sans">
                  {resume.skills.map((s, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                      <span className="font-bold text-slate-900 shrink-0 min-w-[150px]">{s.category}:</span>
                      <span className="text-slate-700">{s.items}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Professional Experience */}
            {resume.experience.length > 0 && (
              <section className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
                  Professional Experience
                </h2>
                <div className="space-y-3">
                  {resume.experience.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-slate-900">{exp.role}</span>
                          <span className="text-blue-800 font-semibold">— {exp.company}</span>
                          <span className="text-slate-500 text-[11px]">({exp.location})</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 font-medium">
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-700 font-sans leading-relaxed">
                        {exp.highlights.map((h, hIdx) => (
                          <li key={hIdx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Key Projects */}
            {resume.projects.length > 0 && (
              <section className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
                  Selected Engineering Projects
                </h2>
                <div className="space-y-2">
                  {resume.projects.map((p) => (
                    <div key={p.id} className="text-xs space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-slate-900">{p.title}</span>
                          {p.techStack && (
                            <span className="text-teal-700 text-[11px] font-mono">[{p.techStack}]</span>
                          )}
                        </div>
                        {p.link && (
                          <span className="text-blue-700 text-[11px] underline truncate max-w-[200px]">
                            {p.link}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans pl-1">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Education */}
            {resume.education.length > 0 && (
              <section className="mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
                  Education &amp; Credentials
                </h2>
                <div className="space-y-1.5 text-xs">
                  {resume.education.map((edu) => (
                    <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{edu.degree}</span>
                        <span className="text-slate-700"> — {edu.institution}</span>
                        {edu.honors && <span className="text-slate-500 italic"> ({edu.honors})</span>}
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 font-medium">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          subtext={modalConfig.subtext}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          variant={modalConfig.variant}
          theme={theme}
        />
      )}
    </div>
  );
}
