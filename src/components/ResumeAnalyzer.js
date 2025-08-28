// ResumeAnalyzer.jsx
import React, { useState, useRef } from 'react';
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js";
import mammoth from "mammoth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ---------- PDF.js worker for PDF text extraction ----------
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/* =========================
   TEXT EXTRACTION UTILITIES
   ========================= */

// PDF
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    return text.trim();
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error("Could not extract text from PDF. Please paste your resume text manually.");
  }
}

// DOCX (browser)
async function extractTextFromDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction failed:", error);
    throw new Error("Could not extract text from DOCX. Please paste your resume text manually.");
  }
}

// TXT
async function extractTextFromTXT(file) {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error("TXT extraction failed:", error);
    throw new Error("Could not extract text from TXT. Please paste your resume text manually.");
  }
}

// Auto detect
async function extractResumeText(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return await extractTextFromPDF(file);
  if (ext === 'docx') return await extractTextFromDOCX(file);
  if (ext === 'txt') return await extractTextFromTXT(file);
  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
}

/* =========================
   GEMINI ANALYSIS
   ========================= */

async function geminiAnalyzeResume({ apiKey, resumeText }) {
  const prompt = `
You are an AI ATS Resume Analyzer.
Given the resume text below, do the following:
1. Give an ATS Compatibility Score out of 100.
2. List at least 5 key findings (mix positives and negatives, use ✅ for positive, ⚠️ for warnings).
3. Provide actionable improvement tips (at least 3) in a list.
4. Suggest the best resume format for this candidate (chronological, functional, hybrid, etc) and explain why.
5. Suggest 3-5 job roles that fit this resume.
6. Output only in the following JSON format without any additional text:
{
  "score": <number>,
  "findings": [<string>, ...],
  "improvementTips": [<string>, ...],
  "resumeFormat": "<string>",
  "resumeFormatReason": "<string>",
  "suggestedRoles": [<string>, ...]
}
Resume:
${resumeText.substring(0, 15000)}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('Empty response from AI');

    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Response does not contain valid JSON');
    }
  } catch (err) {
    console.error("Gemini API error:", err);
    throw new Error(err.message || 'Failed to analyze resume');
  }
}

/* =========================
   ATS RESUME BUILDER (pdf-lib)
   ========================= */

// Simple text wrap helper using pdf-lib metrics
function wrapText({ text, font, fontSize, maxWidth }) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(trial, fontSize);
    if (width <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      // If a single word is too long, hard-split it
      if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
        let chunk = '';
        for (const ch of w) {
          const t = chunk + ch;
          if (font.widthOfTextAtSize(t, fontSize) <= maxWidth) {
            chunk = t;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        line = chunk;
      } else {
        line = w;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateAtsPdf(form) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const margin = 50;
  const contentWidth = width - margin * 2;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Baseline sizes
  const nameSize = 20;
  const sectionTitle = 12;
  const bodySize = 10;
  const lineGap = 4;

  let y = height - margin;

  // Header: Name + Title
  const nameLine = `${form.name || ''}`;
  page.drawText(nameLine, { x: margin, y, size: nameSize, font: bold, color: rgb(0, 0, 0) });
  y -= nameSize + 4;

  if (form.roleTitle) {
    page.drawText(form.roleTitle, { x: margin, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= 12 + 8;
  }

  // Contact line (single line: email | phone | location | links)
  const links = [form.email, form.phone, form.location, form.website, form.linkedIn, form.github]
    .filter(Boolean)
    .join(' | ');
  if (links) {
    const lines = wrapText({ text: links, font, fontSize: bodySize, maxWidth: contentWidth });
    lines.forEach(line => {
      page.drawText(line, { x: margin, y, size: bodySize, font, color: rgb(0, 0, 0) });
      y -= bodySize + lineGap;
    });
    y -= 6;
  }

  // Section: Summary
  if (form.summary) {
    page.drawText("PROFESSIONAL SUMMARY", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 6;
    const lines = wrapText({ text: form.summary, font, fontSize: bodySize, maxWidth: contentWidth });
    lines.forEach(line => {
      if (y < margin + 60) {
        // Add new page if needed
      }
      page.drawText(line, { x: margin, y, size: bodySize, font });
      y -= bodySize + lineGap;
    });
    y -= 8;
  }

  // Section: Skills
  const skills = (form.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  if (skills.length) {
    page.drawText("SKILLS", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 6;
    const skillLine = skills.join(' • ');
    const lines = wrapText({ text: skillLine, font, fontSize: bodySize, maxWidth: contentWidth });
    lines.forEach(line => {
      page.drawText(line, { x: margin, y, size: bodySize, font });
      y -= bodySize + lineGap;
    });
    y -= 8;
  }

  // Section: Experience
  if (form.experiences?.length) {
    page.drawText("EXPERIENCE", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 8;

    for (const exp of form.experiences) {
      if (!exp.role && !exp.company) continue;
      const headline = [exp.role, exp.company].filter(Boolean).join(" — ");
      page.drawText(headline, { x: margin, y, size: bodySize + 1, font: bold });
      y -= (bodySize + 1) + 4;

      const meta = [exp.location, [exp.startDate, exp.endDate].filter(Boolean).join(" - ")].filter(Boolean).join(" | ");
      if (meta) {
        const metaLines = wrapText({ text: meta, font, fontSize: bodySize, maxWidth: contentWidth });
        metaLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }

      const bullets = (exp.bullets || '').split('\n').map(b => b.trim()).filter(Boolean);
      for (const b of bullets) {
        const bulletLines = wrapText({ text: `• ${b}`, font, fontSize: bodySize, maxWidth: contentWidth });
        bulletLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }
      y -= 6;
    }
  }

  // Section: Projects
  if (form.projects?.length) {
    page.drawText("PROJECTS", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 8;

    for (const p of form.projects) {
      if (!p.name) continue;
      const pHead = [p.name, p.link].filter(Boolean).join(" — ");
      page.drawText(pHead, { x: margin, y, size: bodySize + 1, font: bold });
      y -= (bodySize + 1) + 4;

      if (p.description) {
        const descLines = wrapText({ text: p.description, font, fontSize: bodySize, maxWidth: contentWidth });
        descLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }

      const bullets = (p.bullets || '').split('\n').map(b => b.trim()).filter(Boolean);
      for (const b of bullets) {
        const bulletLines = wrapText({ text: `• ${b}`, font, fontSize: bodySize, maxWidth: contentWidth });
        bulletLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }
      y -= 6;
    }
  }

  // Section: Education
  if (form.education?.length) {
    page.drawText("EDUCATION", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 8;

    for (const ed of form.education) {
      if (!ed.degree && !ed.institution) continue;
      const head = [ed.degree, ed.institution].filter(Boolean).join(" — ");
      page.drawText(head, { x: margin, y, size: bodySize + 1, font: bold });
      y -= (bodySize + 1) + 4;

      const meta = [ed.location, [ed.startDate, ed.endDate].filter(Boolean).join(" - ")].filter(Boolean).join(" | ");
      if (meta) {
        const metaLines = wrapText({ text: meta, font, fontSize: bodySize, maxWidth: contentWidth });
        metaLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }

      if (ed.details) {
        const detailsLines = wrapText({ text: ed.details, font, fontSize: bodySize, maxWidth: contentWidth });
        detailsLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: bodySize, font });
          y -= bodySize + lineGap;
        });
      }
      y -= 6;
    }
  }

  // Section: Certifications
  const certs = (form.certifications || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (certs.length) {
    page.drawText("CERTIFICATIONS", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 8;
    certs.forEach(c => {
      const lines = wrapText({ text: `• ${c}`, font, fontSize: bodySize, maxWidth: contentWidth });
      lines.forEach(line => {
        page.drawText(line, { x: margin, y, size: bodySize, font });
        y -= bodySize + lineGap;
      });
    });
    y -= 6;
  }

  // Section: Awards
  const awards = (form.awards || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (awards.length) {
    page.drawText("AWARDS", { x: margin, y, size: sectionTitle, font: bold });
    y -= sectionTitle + 8;
    awards.forEach(a => {
      const lines = wrapText({ text: `• ${a}`, font, fontSize: bodySize, maxWidth: contentWidth });
      lines.forEach(line => {
        page.drawText(line, { x: margin, y, size: bodySize, font });
        y -= bodySize + lineGap;
      });
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${(form.name || 'ATS_Resume').replace(/\s+/g, '_')}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   MAIN COMPONENT
   ========================= */

const ResumeAnalyzer = ({ resources = [] }) => {
  // Tabs
  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' | 'builder'

  // Analyzer state
  const [resumeText, setResumeText] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState('');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [resumeScore, setResumeScore] = useState(0);
  const [improvementTips, setImprovementTips] = useState([]);
  const [findings, setFindings] = useState([]);
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [resumeFormat, setResumeFormat] = useState('');
  const [resumeFormatReason, setResumeFormatReason] = useState('');
  const fileInputRef = useRef(null);

  // Builder state
  const [form, setForm] = useState({
    name: '',
    roleTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedIn: '',
    github: '',
    summary: '',
    skills: '',
    experiences: [
      { role: '', company: '', location: '', startDate: '', endDate: '', bullets: '' },
    ],
    projects: [{ name: '', link: '', description: '', bullets: '' }],
    education: [{ degree: '', institution: '', location: '', startDate: '', endDate: '', details: '' }],
    certifications: '',
    awards: '',
  });

  // ----- Analyzer handlers -----
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    // content-type may be empty on some browsers; rely also on extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) && !['pdf','docx','txt'].includes(ext)) {
      alert('Please upload PDF, DOCX, or TXT file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setUploadedResume(file);
    setResumeText('');
  };

  const analyzeResume = async () => {
    let text = resumeText.trim();
    if (uploadedResume && !text) {
      setResumeFeedback('Extracting resume text...');
      try {
        text = await extractResumeText(uploadedResume);
        setResumeText(text);
      } catch (error) {
        setResumeFeedback(`❌ ${error.message}`);
        setIsAnalyzingResume(false);
        return;
      }
    }

    if (!text) {
      alert('Please upload a resume or paste your resume text');
      return;
    }

    setIsAnalyzingResume(true);
    setResumeFeedback('Analyzing your resume with AI...');

    try {
      const result = await geminiAnalyzeResume({
        apiKey: "AIzaSyC2Psvxy3aRne0-berI59WXCCPaKRW_5-g", // 🔒 put your key in env for production
        resumeText: text,
      });

      setResumeScore(result.score || 0);
      setFindings(result.findings || []);
      setImprovementTips(result.improvementTips || []);
      setResumeFormat(result.resumeFormat || '');
      setResumeFormatReason(result.resumeFormatReason || '');
      setSuggestedRoles(result.suggestedRoles || []);
      setResumeFeedback('');
    } catch (err) {
      setResumeFeedback(`❌ Failed to analyze resume. Reason: ${err.message || err}`);
      setResumeScore(0);
      setFindings([]);
      setImprovementTips([]);
      setResumeFormat('');
      setResumeFormatReason('');
      setSuggestedRoles([]);
    }
    setIsAnalyzingResume(false);
  };

  const clearResume = () => {
    setUploadedResume(null);
    setResumeText('');
    setResumeFeedback('');
    setResumeScore(0);
    setImprovementTips([]);
    setFindings([]);
    setResumeFormat('');
    setResumeFormatReason('');
    setSuggestedRoles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----- Builder handlers -----
  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateArrayField = (section, index, key, value) =>
    setForm(prev => {
      const copy = [...prev[section]];
      copy[index] = { ...copy[index], [key]: value };
      return { ...prev, [section]: copy };
    });
  const addItem = (section, emptyObj) =>
    setForm(prev => ({ ...prev, [section]: [...prev[section], emptyObj] }));
  const removeItem = (section, index) =>
    setForm(prev => {
      const copy = [...prev[section]];
      copy.splice(index, 1);
      return { ...prev, [section]: copy };
    });

  return (
    <div className="resource-content">
      <h3>CV & Resume Resources</h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button
          onClick={() => setActiveTab('analyzer')}
          className={activeTab === 'analyzer' ? 'tab active' : 'tab'}
        >
          ATS Analyzer
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={activeTab === 'builder' ? 'tab active' : 'tab'}
        >
          ATS Resume Builder (PDF)
        </button>
      </div>

      {/* Resource links */}
      <div className="resources-grid">
        {resources.map(resource => (
          <a key={resource.id} href={resource.url} className="resource-card" target="_blank" rel="noopener noreferrer">
            <h4>{resource.title}</h4>
            <p>{resource.description}</p>
            <span className="resource-link">Explore →</span>
          </a>
        ))}
      </div>

      {activeTab === 'analyzer' && (
        <div className="ats-checker">
          <h4>AI-Powered ATS Resume Analyzer</h4>
          <p>Upload your resume (PDF, DOCX, TXT) or paste your resume text to get AI-powered feedback.</p>

          <div className="resume-upload-container">
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                className="file-input"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="upload-label">
                <div className="upload-icon">📄</div>
                <p className="upload-text">
                  {uploadedResume ? uploadedResume.name : 'Choose file or drag it here'}
                </p>
                <p className="upload-subtext">Max file size: 5MB</p>
              </label>
            </div>
            {uploadedResume && (
              <button onClick={clearResume} className="clear-button">Remove File</button>
            )}
          </div>

          <div className="or-divider"><span>OR</span></div>

          <div className="text-input-container">
            <h5>Paste Resume Text</h5>
            <textarea
              className="resume-input"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows="6"
            />
          </div>

          <button
            onClick={analyzeResume}
            disabled={isAnalyzingResume || (!uploadedResume && !resumeText.trim())}
            className="analyze-button"
          >
            {isAnalyzingResume ? 'Analyzing...' : 'Analyze Resume'}
          </button>

          {(resumeFeedback || resumeScore > 0) && (
            <div className="resume-feedback">
              <div className="feedback-header">
                <h5>AI Feedback</h5>
                {resumeScore > 0 && (
                  <div className="score-circle" style={{'--score-percent': `${resumeScore}%`}}>
                    <span className="score-value">{resumeScore}</span>
                  </div>
                )}
              </div>
              <div className="feedback-content">
                {resumeFeedback && <pre>{resumeFeedback}</pre>}
                {findings.length > 0 && (
                  <div className="findings">
                    <h6>Key Findings:</h6>
                    <ul>
                      {findings.map((tip, idx) => (
                        <li key={idx} className={tip.includes('✅') ? 'positive' : tip.includes('⚠️') ? 'warning' : ''}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvementTips.length > 0 && (
                  <div className="improvement-tips">
                    <h6>Improvement Tips:</h6>
                    <ul>
                      {improvementTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {resumeFormat && (
                  <div className="resume-format">
                    <h6>Suggested Resume Format:</h6>
                    <p><b>{resumeFormat}</b>: {resumeFormatReason}</p>
                  </div>
                )}
                {suggestedRoles.length > 0 && (
                  <div className="suggested-roles">
                    <h6>Suggested Job Roles:</h6>
                    <ul>
                      {suggestedRoles.map((role, idx) => (
                        <li key={idx}>{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="ats-builder">
          <h4>ATS Optimization Guide & Resume Builder</h4>
          <p>Fill in your details. Keep it concise, keyword-rich, and consistent. Use bullet points with measurable impact.</p>

          {/* Contact Section */}
          <div className="builder-section">
            <h5>Contact & Header</h5>
            <div className="grid two">
              <input placeholder="Full Name (e.g., Mukesh Ganta)" value={form.name} onChange={e => updateField('name', e.target.value)} />
              <input placeholder="Target Title (e.g., Software Engineer)" value={form.roleTitle} onChange={e => updateField('roleTitle', e.target.value)} />
              <input placeholder="Email" value={form.email} onChange={e => updateField('email', e.target.value)} />
              <input placeholder="Phone" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
              <input placeholder="Location (City, Country)" value={form.location} onChange={e => updateField('location', e.target.value)} />
              <input placeholder="Portfolio / Website URL" value={form.website} onChange={e => updateField('website', e.target.value)} />
              <input placeholder="LinkedIn URL" value={form.linkedIn} onChange={e => updateField('linkedIn', e.target.value)} />
              <input placeholder="GitHub URL" value={form.github} onChange={e => updateField('github', e.target.value)} />
            </div>
          </div>

          {/* Summary */}
          <div className="builder-section">
            <h5>Professional Summary</h5>
            <textarea placeholder="3–4 lines summarizing your experience, tech stack, and impact…" rows={4} value={form.summary} onChange={e => updateField('summary', e.target.value)} />
          </div>

          {/* Skills */}
          <div className="builder-section">
            <h5>Skills (comma-separated)</h5>
            <input placeholder="e.g., React, Node.js, MongoDB, AWS, Docker, Python, SQL" value={form.skills} onChange={e => updateField('skills', e.target.value)} />
          </div>

          {/* Experience */}
          <div className="builder-section">
            <h5>Experience</h5>
            {form.experiences.map((exp, idx) => (
              <div key={`exp-${idx}`} className="card">
                <div className="grid two">
                  <input placeholder="Role / Title" value={exp.role} onChange={e => updateArrayField('experiences', idx, 'role', e.target.value)} />
                  <input placeholder="Company" value={exp.company} onChange={e => updateArrayField('experiences', idx, 'company', e.target.value)} />
                  <input placeholder="Location" value={exp.location} onChange={e => updateArrayField('experiences', idx, 'location', e.target.value)} />
                  <input placeholder="Start (e.g., Jan 2023)" value={exp.startDate} onChange={e => updateArrayField('experiences', idx, 'startDate', e.target.value)} />
                  <input placeholder="End (e.g., Present)" value={exp.endDate} onChange={e => updateArrayField('experiences', idx, 'endDate', e.target.value)} />
                </div>
                <textarea
                  placeholder={"Bullets (one per line)\n• Led X to achieve Y\n• Optimized Z by 30% using A, B"}
                  rows={4}
                  value={exp.bullets}
                  onChange={e => updateArrayField('experiences', idx, 'bullets', e.target.value)}
                />
                <div className="row-right">
                  <button onClick={() => removeItem('experiences', idx)} disabled={form.experiences.length === 1}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => addItem('experiences', { role: '', company: '', location: '', startDate: '', endDate: '', bullets: '' })}>
              + Add Experience
            </button>
          </div>

          {/* Projects */}
          <div className="builder-section">
            <h5>Projects</h5>
            {form.projects.map((p, idx) => (
              <div key={`proj-${idx}`} className="card">
                <div className="grid two">
                  <input placeholder="Project Name" value={p.name} onChange={e => updateArrayField('projects', idx, 'name', e.target.value)} />
                  <input placeholder="Link (GitHub/Live URL)" value={p.link} onChange={e => updateArrayField('projects', idx, 'link', e.target.value)} />
                </div>
                <textarea placeholder="1–2 lines describing the project, stack, and impact" rows={3} value={p.description} onChange={e => updateArrayField('projects', idx, 'description', e.target.value)} />
                <textarea placeholder={"Bullets (one per line)\n• Built feature X using Y\n• Improved performance by Z%"} rows={3} value={p.bullets} onChange={e => updateArrayField('projects', idx, 'bullets', e.target.value)} />
                <div className="row-right">
                  <button onClick={() => removeItem('projects', idx)} disabled={form.projects.length === 1}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => addItem('projects', { name: '', link: '', description: '', bullets: '' })}>
              + Add Project
            </button>
          </div>

          {/* Education */}
          <div className="builder-section">
            <h5>Education</h5>
            {form.education.map((ed, idx) => (
              <div key={`edu-${idx}`} className="card">
                <div className="grid two">
                  <input placeholder="Degree (e.g., B.Tech in CSE)" value={ed.degree} onChange={e => updateArrayField('education', idx, 'degree', e.target.value)} />
                  <input placeholder="Institution" value={ed.institution} onChange={e => updateArrayField('education', idx, 'institution', e.target.value)} />
                  <input placeholder="Location" value={ed.location} onChange={e => updateArrayField('education', idx, 'location', e.target.value)} />
                  <input placeholder="Start (e.g., 2021)" value={ed.startDate} onChange={e => updateArrayField('education', idx, 'startDate', e.target.value)} />
                  <input placeholder="End (e.g., 2025)" value={ed.endDate} onChange={e => updateArrayField('education', idx, 'endDate', e.target.value)} />
                </div>
                <textarea placeholder="Details (CGPA, relevant coursework, honors)" rows={3} value={ed.details} onChange={e => updateArrayField('education', idx, 'details', e.target.value)} />
                <div className="row-right">
                  <button onClick={() => removeItem('education', idx)} disabled={form.education.length === 1}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => addItem('education', { degree: '', institution: '', location: '', startDate: '', endDate: '', details: '' })}>
              + Add Education
            </button>
          </div>

          {/* Certifications */}
          <div className="builder-section">
            <h5>Certifications</h5>
            <textarea
              placeholder={"One per line\nAWS Certified Cloud Practitioner\nCoursera: Deep Learning Specialization"}
              rows={3}
              value={form.certifications}
              onChange={e => updateField('certifications', e.target.value)}
            />
          </div>

          {/* Awards */}
          <div className="builder-section">
            <h5>Awards</h5>
            <textarea
              placeholder={"One per line\nSmart India Hackathon 2024 – Winner\nCollege Merit Scholarship"}
              rows={3}
              value={form.awards}
              onChange={e => updateField('awards', e.target.value)}
            />
          </div>

          <div className="row-right" style={{ gap: 8 }}>
            <button onClick={() => generateAtsPdf(form)}>Generate & Download PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
