import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const FooterBar = () => {
  const { t } = useLanguage();
  const links = [
    { to: "/lessons",   label: t("nav.lessons") },
    { to: "/tests",     label: t("nav.tests") },
    { to: "/fun",       label: t("nav.trainers") },
    { to: "/analytics", label: t("nav.analytics") },
    { to: "/profile",   label: t("nav.profile") },
  ];
  return (
    <footer className="ft-root">
      <div className="ft-inner">
        <div className="ft-brand">
          <span className="ft-logo">Cyber<span>Aware</span></span>
          <p className="ft-tagline">{t("footer.tagline")}</p>
        </div>
        <nav className="ft-links" aria-label="Footer">
          {links.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}
        </nav>
      </div>
      <p className="ft-copy">{t("footer.copy", { year: new Date().getFullYear() })}</p>
    </footer>
  );
};

export default FooterBar;
