// src/components/HeaderBar.jsx
import React, { useState } from "react";
import { Menu, Drawer, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MenuOutlined } from "@ant-design/icons";

const HeaderBar = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const menuItems = [
    { label: <Link to="/lessons">Уроки</Link>, key: "/lessons" },
    { label: <Link to="/tests">Тесты</Link>, key: "/tests" },
    { label: <Link to="/analytics">Аналитика</Link>, key: "/analytics" },
    { label: <Link to="/fun">Тренажёры</Link>, key: "/fun" },
  ];

  const showDrawer = () => setVisible(true);
  const closeDrawer = () => setVisible(false);

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
        padding: "0 20px",
      }}
    >
      {/* Лого */}
      <div className="logo" style={{ fontSize: 24, fontWeight: "bold" }}>
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} style={{ display: "inline-block" }}>
          <Link to="/" style={{ color: "#001529", textDecoration: "none" }}>
            CyberAware 🔐
          </Link>
        </motion.div>
      </div>

      {/* Desktop Menu */}
      <div className="desktop-menu" style={{ display: "none", flex: 1, justifyContent: "flex-end" }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          theme="light"
          style={{ background: "transparent", flex: 1, justifyContent: "flex-end" }}
          items={menuItems}
        />
      </div>

      {/* Mobile Hamburger */}
      <div className="mobile-menu" style={{ display: "flex", alignItems: "center" }}>
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 24 }} />}
          onClick={showDrawer}
        />
      </div>

      {/* Drawer for mobile */}
      <Drawer
        title="CyberAware 🔐"
        placement="right"
        onClose={closeDrawer}
        visible={visible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={closeDrawer} // закрываем drawer при выборе пункта
        />
      </Drawer>

      {/* Стилизация для адаптива через media queries */}
      <style>{`
        @media(min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default HeaderBar;
