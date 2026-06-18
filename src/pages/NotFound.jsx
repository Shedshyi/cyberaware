import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="nf-root">
      <motion.div
        className="nf-card"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nf-code">{t("notFound.code")}</div>
        <div className="nf-icon">{t("notFound.icon")}</div>
        <h1 className="nf-title">{t("notFound.title")}</h1>
        <p className="nf-desc">{t("notFound.desc")}</p>
        <div className="nf-actions">
          <Link to="/" className="t-btn t-btn-primary t-btn-lg">{t("notFound.home")}</Link>
          <Link to="/lessons" className="t-btn t-btn-outline t-btn-lg">{t("notFound.lessons")}</Link>
        </div>
      </motion.div>
    </div>
  );
}
