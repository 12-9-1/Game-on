import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { SiApplearcade } from "react-icons/si";
import { FaDiscord } from "react-icons/fa";

const Footer = () => {
  const location = useLocation();
  if (location.pathname === "/game") return null;

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* COLUMNA 1: Logo */}
        <div className="footer-column footer-logo-column">
          <Link
            to="/"
            aria-label="Battle Quiz Arena"
            className="footer-logo-link"
          >
            <SiApplearcade className="footer-logo-icon" />
            <div className="logo-container">
              <span className="battle-text">BATTLE</span>
              <span className="quiz-text">QUIZ</span>
              <span className="text-arena">ARENA</span>
            </div>
          </Link>
        </div>

        {/* COLUMNA 2: Enlaces Rápidos */}
        <div className="footer-column footer-links-column">
          <h4 className="footer-column-title">Enlaces Rápidos</h4>
          <nav className="footer-links">
            <Link to="/">Inicio</Link>
            <Link to="/about">Sobre Nosotros</Link>
            <Link to="/ranking">Ranking</Link>
          </nav>
        </div>

        {/* COLUMNA 3: Redes Sociales */}
        <div className="footer-column footer-social-column">
          <h4 className="footer-column-title">Redes Sociales</h4>
          <div className="footer-social-links">
            <a
              href="https://discord.gg/VfqPbY4ZUG"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="social-link discord-link"
            >
              <FaDiscord />
              <span>Discord</span>
            </a>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE COPYRIGHT */}
      <div className="footer-copyright">
        <p>
          &copy; {new Date().getFullYear()} Battle Quiz Arena. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
