import React from "react";
import "./Bask.css";

const Bask = () => {
  return (
    <div className="bask-container">
      <h1 className="bask-title">🧩 Take a Break & Refresh Your Mind</h1>
      <p className="bask-subtitle">Choose a game and enjoy!</p>

      <div className="bask-cards">
        {/* Chess Card */}
        <div
          className="bask-card"
          onClick={() => window.open("https://boldchess.com/play/computer/", "_blank")}
        >
          
          <h2 className="bask-card-title">♟️ Play Chess</h2>
          <p className="bask-card-desc">
            Sharpen your strategy and test your mind against the computer.
          </p>
        </div>

        {/* Sudoku Card */}
        <div
          className="bask-card"
          onClick={() => window.open("https://sudoku.com/", "_blank")}
        >
          
          <h2 className="bask-card-title">🔢 Play Sudoku</h2>
          <p className="bask-card-desc">
            Relax with a number puzzle and refresh your brain cells.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Bask;
