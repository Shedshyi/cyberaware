import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "antd";
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
import DataSortingPage from "./pages/DataStoringPage";
import HackerGame from "./pages/HackerGame";
import './styles.css';


const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        <HeaderBar />
        <Content style={{ padding: "2rem" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonPage />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/fun" element={<FunZone />} />
            <Route path="/fake-news" element = {<FakeNews/>} />
            <Route path="/phishing" element={<PhishingTraining />} />
            <Route path="/data-sort" element={<DataSortingPage />} />
            <Route path="/hacker-game" element={<HackerGame/>} />
            <Route path="/password-checker" element={<PasswordChecker />} />
          </Routes>
        </Content>
        <FooterBar />
      </Layout>
    </Router>
  );
}

export default App;
