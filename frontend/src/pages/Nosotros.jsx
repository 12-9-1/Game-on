
import React from "react";
import "./Nosotros.css";

const miembros = [
  {
    nombre: "Profe Eze",
    avatar: "https://models.readyplayer.me/69190d4628f4be8b0ce70f21.png",
    presentacion: "Soy el mentor del Grupo 4. Ellos desarrollaron este proyecto con trabajo en equipo, constancia, creatividad y ganas de aprender. Estoy muy orgulloso del crecimiento de cada uno. ¡Felicitaciones, Grupo 4!",
    esProfe: true,
  },
  {
    nombre: "Lisbet",
    avatar: "https://models.readyplayer.me/6918c40c1aa3af821ab0c3a6.png",
    presentacion: "Desarrollo frontend, backend y administración del proyecto.",
    esProfe: false,
  },
  {
    nombre: "Mateo",
    avatar: "https://models.readyplayer.me/69190a6ffb99478e41b9e0ca.png",
    presentacion: "Encargado de lógica del juego y validaciones.",
    esProfe: false,
  },
  {
    nombre: "Álvaro",
    avatar: "https://models.readyplayer.me/6918d465132e61458cdc0c1f.png",
    presentacion: "Diseño de interfaz y experiencia de usuario.",
    esProfe: false,
  },
  {
    nombre: "Tomás",
    avatar: "https://models.readyplayer.me/6918d5e41aa3af821ab29dda.png",
    presentacion: "Soporte técnico, conexión con backend y testing.",
    esProfe: false,
  },
];

export default function Nosotros() {
  return (
    <div className="nosotros-container">
      <h1>Nuestro Equipo</h1>

      <p className="intro-proyecto">
        Este proyecto fue desarrollado por el Grupo 4, integrando diseño, programación, trabajo en equipo y mucha dedicación.  
        Aquí te presentamos a cada integrante y al profesor que nos acompañó en todo el proceso.
      </p>

      <div className="nosotros-grid-custom">
        <div className="fila-equipo fila-1">
          {miembros.slice(0, 3).map((u) => (
            <div key={u.nombre} className={`card ${u.esProfe ? "profe-card" : ""}`}>
              <img src={u.avatar} alt={u.nombre} className="avatar-img" />
              <h3>{u.nombre}</h3>
              <p className="presentacion">{u.presentacion}</p>
            </div>
          ))}
        </div>
        <div className="fila-equipo fila-2">
          {miembros.slice(3).map((u) => (
            <div key={u.nombre} className={`card ${u.esProfe ? "profe-card" : ""}`}>
              <img src={u.avatar} alt={u.nombre} className="avatar-img" />
              <h3>{u.nombre}</h3>
              <p className="presentacion">{u.presentacion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
