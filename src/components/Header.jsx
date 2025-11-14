// src/components/HeaderBar.jsx
import React from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const HeaderBar = () => {
  const location = useLocation();

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        background: "#f0f2f5",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      <div className="logo" style={{ fontSize: 24, fontWeight: "bold" }}>
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} style={{ display: "inline-block" }}>
          <Link to="/" style={{ color: "#001529", textDecoration: "none" }}>
            CyberAware 🔐
          </Link>
        </motion.div>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        theme="light"
        style={{ background: "transparent", flex: 1, justifyContent: "flex-end" }}
        items={[
          { label: <Link to="/lessons">Уроки</Link>, key: "/lessons" },
          { label: <Link to="/tests">Тесты</Link>, key: "/tests" },
          { label: <Link to="/analytics">Аналитика</Link>, key: "/analytics" },
          { label: <Link to="/fun">Тренажёры</Link>, key: "/fun" },
        ]}
      />
    </motion.div>
  );
};

export default HeaderBar;
