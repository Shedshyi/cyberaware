import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

const FooterBar = () => {
  const { t } = useLanguage();
  return (
    <footer className="app-footer">
      <p style={{ margin: 5, fontSize: "1.1rem" }}>{t("footer.copy")}</p>
      <p style={{ margin: 5, fontSize: "0.9rem" }}>
        🌐 {t("footer.follow")}
        <span style={{ margin: "0 10px" }}>🐦 Twitter</span>
        <span style={{ margin: "0 10px" }}>📘 Facebook</span>
        <span style={{ margin: "0 10px" }}>📸 Instagram</span>
      </p>
      <p style={{ margin: 5, fontSize: "0.8rem", color: "#aaa" }}>
        {t("footer.tagline")}
      </p>
    </footer>
  );
};

export default FooterBar;
