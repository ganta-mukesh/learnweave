import React, { useState, useEffect, useRef } from "react";
import "./RoadmapsSection.css";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from "react-flow-renderer";
import { toPng, toSvg } from "html-to-image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const RoadmapFlow = ({ nodes, edges }) => {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      const firstNode = nodes[0];
      // 👇 Center the viewport on the first node (Day 1)
      setCenter(firstNode.position.x, firstNode.position.y, {
        zoom: 1,
        duration: 800, // smooth animation
      });
    }
  }, [nodes, setCenter]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnScroll
      zoomOnScroll
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
};

const RoadmapsSection = () => {
  const [technology, setTechnology] = useState("");
  const [days, setDays] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const roadmapRef = useRef(null);

  const generateRoadmap = async () => {
    if (!technology || !days) {
      alert("Please enter both technology and days.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${baseURL}/api/generateroadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology, days }),
      });

      const data = await response.json();

      if (response.ok) {
        const steps = data.roadmap
          .split("\n\n")
          .filter((line) => line.trim() !== "");
        setRoadmap(steps);
      } else {
        setRoadmap(["Failed to generate roadmap. Please try again."]);
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      setRoadmap(["Failed to generate roadmap. Please try again."]);
    }

    setLoading(false);
  };

  // ✅ Download Roadmap as .txt
  const downloadRoadmapTxt = () => {
    if (roadmap.length === 0) return;
    const content = roadmap.join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${technology}_roadmap_${days}days.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Download Roadmap as PNG
  const downloadPng = () => {
  const flowChart = document.querySelector(".react-flow__viewport");
  if (!flowChart) return;

  toPng(flowChart, { backgroundColor: "white" })
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "flowchart.png";
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => console.error("PNG export failed:", err));
};

// Function to download full chart as PDF
const downloadPdf = () => {
  const flowchart = document.getElementById("roadmap-flow"); // ✅ correct ID

  if (!flowchart) return;

  html2canvas(flowchart, { backgroundColor: "#fff", scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const newWidth = imgWidth * ratio;
    const newHeight = imgHeight * ratio;

    pdf.addImage(imgData, "PNG", 20, 20, newWidth, newHeight);
    pdf.save("flowchart.pdf");
  });
};



  // ✅ Convert roadmap to flowchart nodes & edges
  const getFlowElements = () => {
    const nodes = roadmap.map((step, i) => ({
      id: `${i}`,
      data: { label: step },
      position: { x: 200, y: i * 180 }, // vertical layout
      style: {
        border: "2px solid #2ecc71",
        borderRadius: "10px",
        padding: "10px",
        background: "#f0fff0",
        width: 320,
        fontSize: "14px",
        whiteSpace: "pre-wrap",
      },
    }));

    const edges = roadmap.slice(1).map((_, i) => ({
      id: `e${i}-${i + 1}`,
      source: `${i}`,
      target: `${i + 1}`,
      animated: true,
      style: { stroke: "#3498db" },
    }));

    return { nodes, edges };
  };

  const { nodes, edges } = getFlowElements();

  return (
    <section className="roadmaps-section">
      <h2>🚀 AI Placement Roadmap Generator</h2>
      <p className="subtitle">
        Get a personalized learning plan for any technology
      </p>

      <div className="input-box">
        <input
          type="text"
          placeholder="Enter technology (e.g., React, Python, AI)"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter number of days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          min="1"
          max="365"
        />
        <button onClick={generateRoadmap} disabled={loading}>
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
        {roadmap.length > 0 && (
          <>
            <button className="download-btn" onClick={downloadRoadmapTxt}>
              ⬇️ Download TXT
            </button>
            <button className="download-btn" onClick={downloadPng}>
              ⬇️ Download PNG
            </button>
            <button className="download-btn" onClick={downloadPdf}>
              ⬇️ Download PDF
            </button>
          </>
        )}
      </div>

      <div className="roadmap-frame">
        {roadmap.length > 0 ? (
          <div>
            <h3>
              Your {days}-Day {technology} Learning Plan
            </h3>
            <div
              id="roadmap-flow"
              ref={roadmapRef}
              style={{
                width: "100%",
                height: "80vh",
                border: "1px solid #ccc",
                borderRadius: "10px",
              }}
            >
              <ReactFlowProvider>
                <RoadmapFlow nodes={nodes} edges={edges} />
              </ReactFlowProvider>
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <div className="placeholder-icon">📚</div>
            <p className="placeholder-text">Your roadmap will appear here...</p>
            <p className="placeholder-subtext">
              Enter a technology and number of days to generate a personalized
              learning plan
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RoadmapsSection;
