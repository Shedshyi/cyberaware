import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import HeaderBar from "./components/Header";
import FooterBar from "./components/Footer";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import LessonPage from "./pages/LessonPage";
import Tests from "./pages/Tests";
import Analytics from "./pages/Analytics";
import FunZone from "./pages/FunZone";
import TestPage from './pages/TestPage';
import FakeNews from "./pages/FakeNews";
import PasswordChecker from "./pages/PasswordChecker";
import PhishingTraining from "./pages/PhishingTraining"; 
import DataStoringPage from "./pages/DataStoringPage";
import HackerGame from "./pages/HackerGame";
import SocialEngineeringPage from "./pages/SocialEngineeringPage";
import URLScannerPage from "./pages/URLScannerPage";
import ProfilePage from "./pages/ProfilePage";
import CertificatePage from "./pages/CertificatePage";
import NotFound from "./pages/NotFound";
import './styles.css';

function App() {
  return (
    <LanguageProvider>
    <Router>
      <div className="app-layout">
        <HeaderBar />
        <main className="site-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonPage />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/fun" element={<FunZone />} />
            <Route path="/fake-news" element={<FakeNews />} />
            <Route path="/phishing" element={<PhishingTraining />} />
            <Route path="/data-sort" element={<DataStoringPage />} />
            <Route path="/hacker-game" element={<HackerGame />} />
            <Route path="/password-checker" element={<PasswordChecker />} />
            <Route path="/social-eng" element={<SocialEngineeringPage />} />
            <Route path="/url-scanner" element={<URLScannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/certificate" element={<CertificatePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <FooterBar />
      </div>
    </Router>
    </LanguageProvider>
  );
}

export default App;
