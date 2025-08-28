import React, { useState } from 'react';
import './InterviewQuestions.css';

const InterviewQuestions = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [logoErrors, setLogoErrors] = useState({});

  // Google Drive folder links and PDF files for each company
  const companyData = {
    1: { // Google
      folderLink: 'https://drive.google.com/drive/folders/1m-s_enIB9U4eSSW0spUN9Y8Z6pf6KbdD?usp=drive_link',
      files: [
        { id: 'file1', name: 'Google SWE Interview Questions.pdf', url: 'https://drive.google.com/file/d/file1/preview' },
        { id: 'file2', name: 'Google Product Manager Questions.pdf', url: 'https://drive.google.com/file/d/file2/preview' }
      ]
    },
    2: { // Amazon
      folderLink: 'https://drive.google.com/drive/folders/2def456',
      files: [
        { id: 'file3', name: 'Amazon SDE Interview Questions.pdf', url: 'https://drive.google.com/file/d/file3/preview' },
        { id: 'file4', name: 'Amazon Leadership Principles.pdf', url: 'https://drive.google.com/file/d/file4/preview' }
      ]
    },
    3: { // Microsoft
      folderLink: 'https://drive.google.com/drive/folders/3ghi789',
      files: [
        { id: 'file5', name: 'Microsoft Software Engineer Questions.pdf', url: 'https://drive.google.com/file/d/file5/preview' },
        { id: 'file6', name: 'Microsoft Azure Questions.pdf', url: 'https://drive.google.com/file/d/file6/preview' }
      ]
    },
    4: { // Apple
      folderLink: 'https://drive.google.com/drive/folders/4jkl012',
      files: [
        { id: 'file7', name: 'Apple iOS Developer Questions.pdf', url: 'https://drive.google.com/file/d/file7/preview' },
        { id: 'file8', name: 'Apple Hardware Engineer Questions.pdf', url: 'https://drive.google.com/file/d/file8/preview' }
      ]
    },
    5: { // Meta
      folderLink: 'https://drive.google.com/drive/folders/5mno345',
      files: [
        { id: 'file9', name: 'Meta Frontend Questions.pdf', url: 'https://drive.google.com/file/d/file9/preview' },
        { id: 'file10', name: 'Meta System Design Questions.pdf', url: 'https://drive.google.com/file/d/file10/preview' }
      ]
    },
    6: { // Netflix
      folderLink: 'https://drive.google.com/drive/folders/6pqr678',
      files: [
        { id: 'file11', name: 'Netflix Culture Questions.pdf', url: 'https://drive.google.com/file/d/file11/preview' },
        { id: 'file12', name: 'Netflix Streaming Questions.pdf', url: 'https://drive.google.com/file/d/file12/preview' }
      ]
    },
    7: { // Wipro
      folderLink: 'https://drive.google.com/drive/folders/7stu901',
      files: [
        { id: 'file13', name: 'Wipro Technical Questions.pdf', url: 'https://drive.google.com/file/d/file13/preview' },
        { id: 'file14', name: 'Wipro HR Questions.pdf', url: 'https://drive.google.com/file/d/file14/preview' }
      ]
    },
    8: { // Deloitte
      folderLink: 'https://drive.google.com/drive/folders/8vwx234',
      files: [
        { id: 'file15', name: 'Deloitte Consulting Questions.pdf', url: 'https://drive.google.com/file/d/file15/preview' },
        { id: 'file16', name: 'Deloitte Case Studies.pdf', url: 'https://drive.google.com/file/d/file16/preview' }
      ]
    },
    9: { // Infosys
      folderLink: 'https://drive.google.com/drive/folders/9yza567',
      files: [
        { id: 'file17', name: 'Infosys Programming Questions.pdf', url: 'https://drive.google.com/file/d/file17/preview' },
        { id: 'file18', name: 'Infosys Aptitude Questions.pdf', url: 'https://drive.google.com/file/d/file18/preview' }
      ]
    },
    10: { // Accenture
      folderLink: 'https://drive.google.com/drive/folders/0bcd890',
      files: [
        { id: 'file19', name: 'Accenture Technical Questions.pdf', url: 'https://drive.google.com/file/d/file19/preview' },
        { id: 'file20', name: 'Accenture Management Questions.pdf', url: 'https://drive.google.com/file/d/file20/preview' }
      ]
    },
    11: { // TCS
      folderLink: 'https://drive.google.com/drive/folders/1cde123',
      files: [
        { id: 'file21', name: 'TCS Coding Questions.pdf', url: 'https://drive.google.com/file/d/file21/preview' },
        { id: 'file22', name: 'TCS Interview Patterns.pdf', url: 'https://drive.google.com/file/d/file22/preview' }
      ]
    }
  };

  const companies = [
    { id: 1, name: 'Google', domain: 'google.com' },
    { id: 2, name: 'Amazon', domain: 'amazon.com' },
    { id: 3, name: 'Microsoft', domain: 'microsoft.com' },
    { id: 4, name: 'Apple', domain: 'apple.com' },
    { id: 5, name: 'Meta', domain: 'meta.com' },
    { id: 6, name: 'Netflix', domain: 'netflix.com' },
    { id: 7, name: 'Wipro', domain: 'wipro.com' },
    { id: 8, name: 'Deloitte', domain: 'deloitte.com' },
    { id: 9, name: 'Infosys', domain: 'infosys.com' },
    { id: 10, name: 'Accenture', domain: 'accenture.com' },
    { id: 11, name: 'TCS', domain: 'tcs.com' }
  ];

  const handleCompanyClick = (companyId) => {
    setSelectedCompany(companyId);
    // Automatically select the first PDF
    setSelectedPdf(companyData[companyId].files[0]);
    
    // Scroll to PDF viewer
    setTimeout(() => {
      const pdfViewer = document.getElementById('pdf-viewer-section');
      if (pdfViewer) {
        pdfViewer.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handlePdfClick = (pdf) => {
    setSelectedPdf(pdf);
  };

  const handleLogoError = (companyId) => {
    setLogoErrors(prev => ({ ...prev, [companyId]: true }));
  };

  const openFolderInNewTab = () => {
    window.open(companyData[selectedCompany].folderLink, '_blank');
  };

  return (
    <div className="interview-questions-page">
      <h1>Company Interview Questions</h1>
      <p>Select a company to view available interview questions</p>
      
      <div className="companies-grid">
        {companies.map(company => (
          <div 
            key={company.id}
            className={`company-card ${selectedCompany === company.id ? 'selected' : ''}`}
            onClick={() => handleCompanyClick(company.id)}
          >
            <div className="company-logo-container">
              {logoErrors[company.id] ? (
                <div className="company-logo-placeholder">{company.name.charAt(0)}</div>
              ) : (
                <img
                  src={`https://logo.clearbit.com/${company.domain}?size=150`}
                  alt={`${company.name} logo`}
                  onError={() => handleLogoError(company.id)}
                  loading="lazy"
                />
              )}
            </div>
            <h3>{company.name}</h3>
          </div>
        ))}
      </div>

      {selectedCompany && (
        <div id="pdf-viewer-section" className="folder-section">
          <h2>{companies.find(c => c.id === selectedCompany).name} Interview Questions</h2>
          
          <div className="folder-link-container">
            <button onClick={openFolderInNewTab} className="open-folder-btn">
              <i className="fas fa-folder-open"></i> Open Full Folder
            </button>
          </div>

          <div className="pdf-list">
            {companyData[selectedCompany].files.map(pdf => (
              <div 
                key={pdf.id}
                className={`pdf-item ${selectedPdf?.id === pdf.id ? 'selected' : ''}`}
                onClick={() => handlePdfClick(pdf)}
              >
                <div className="pdf-icon">
                  <i className="far fa-file-pdf"></i>
                </div>
                <div className="pdf-name">{pdf.name}</div>
              </div>
            ))}
          </div>

          {selectedPdf && (
            <div className="document-viewer">
              <div className="document-container">
                <iframe 
                  src={selectedPdf.url}
                  title={selectedPdf.name}
                  className="pdf-viewer"
                >
                  Your browser does not support PDFs. 
                  <a href={selectedPdf.url}>Download the PDF instead.</a>
                </iframe>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewQuestions;