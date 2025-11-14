// src/components/Footer.jsx
import React from "react";

const FooterBar = () => (
  <footer style={{
    background: "#001529",
    color: "#fff",
    padding: "30px 20px",
    textAlign: "center",
    borderTop: "4px solid #1890ff",
    marginTop: 50
  }}>
    <p style={{ margin: 5, fontSize: "1.1rem" }}>© 2025 CyberAware Project by Nurgalym Jambul</p>
    <p style={{ margin: 5, fontSize: "0.9rem" }}>
      🌐 Следите за нами: 
      <span style={{ margin: "0 10px" }}>🐦 Twitter</span> 
      <span style={{ margin: "0 10px" }}>📘 Facebook</span> 
      <span style={{ margin: "0 10px" }}>📸 Instagram</span>
    </p>
    <p style={{ margin: 5, fontSize: "0.8rem", color: "#aaa" }}>
      Разрабатываем для безопасного и умного цифрового мира!
    </p>
  </footer>
);

export default FooterBar;
