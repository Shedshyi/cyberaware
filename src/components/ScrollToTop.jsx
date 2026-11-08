import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// При переходе на другую страницу прокручиваем наверх:
// без этого новая страница открывалась с позиции прокрутки предыдущей.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
