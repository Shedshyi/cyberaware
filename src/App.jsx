import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./auth/AuthContext";
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
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/research/OnboardingPage";
import AssessmentPage from "./pages/research/AssessmentPage";
import ResearchDashboard from "./pages/research/ResearchDashboard";
import ResearchAdmin from "./pages/research/ResearchAdmin";
import ResearchGate from "./research/ResearchGate";
import ScrollToTop from "./components/ScrollToTop";
import { ExperienceProvider, RequireFeature, IfFeature } from "./research/experience";
import GameToasts from "./components/GameToasts";
import NotFound from "./pages/NotFound";
import './styles.css';
import './mobile.css'; // после styles.css — переопределяет его правила

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
    <ExperienceProvider>
    <Router>
      <div className="app-layout">
        <ScrollToTop />
        <HeaderBar />
        <main className="site-content">
          <ResearchGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonPage />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/fun" element={<RequireFeature feature="trainers"><FunZone /></RequireFeature>} />
            <Route path="/fake-news" element={<RequireFeature feature="trainers"><FakeNews /></RequireFeature>} />
            <Route path="/phishing" element={<RequireFeature feature="trainers"><PhishingTraining /></RequireFeature>} />
            <Route path="/data-sort" element={<RequireFeature feature="trainers"><DataStoringPage /></RequireFeature>} />
            <Route path="/hacker-game" element={<RequireFeature feature="trainers"><HackerGame /></RequireFeature>} />
            <Route path="/password-checker" element={<RequireFeature feature="trainers"><PasswordChecker /></RequireFeature>} />
            <Route path="/social-eng" element={<RequireFeature feature="trainers"><SocialEngineeringPage /></RequireFeature>} />
            <Route path="/url-scanner" element={<RequireFeature feature="trainers"><URLScannerPage /></RequireFeature>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/certificate" element={<RequireFeature feature="gamification" to="/profile"><CertificatePage /></RequireFeature>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/research/start" element={<OnboardingPage />} />
            <Route path="/research/dashboard" element={<ResearchDashboard />} />
            <Route path="/research/admin" element={<ResearchAdmin />} />
            <Route path="/research/:phase" element={<AssessmentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ResearchGate>
        </main>
        <FooterBar />
        <IfFeature feature="gamification"><GameToasts /></IfFeature>
      </div>
    </Router>
    </ExperienceProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
