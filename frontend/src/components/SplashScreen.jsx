import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./SplashScreen.css";

const SplashScreen = ({ onAnimationComplete }) => {
  const battleRef = useRef(null);
  const quizRef = useRef(null);
  const arenaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ 
      defaults: { ease: "power3.out" },
      onComplete: () => {
        // Fade out después de que termine la animación
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.6,
          delay: 1.5,
          ease: "power2.inOut",
          pointerEvents: "none",
          onComplete: () => {
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }
        });
      }
    });

    tl.fromTo(
      battleRef.current,
      {
        x: -200,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
      }
    );

    tl.fromTo(
      quizRef.current,
      {
        x: -200,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
      },
      "-=0.4" // Empieza antes de que termine Battle
    );

    // "Arena" cae y rota
    tl.fromTo(
      arenaRef.current,
      {
        y: -280,
        rotation: 100,
        opacity: 0,
        transformOrigin: "left bottom",
      },
      {
        y: 0,
        rotation: 23, // Ángulo final inclinado
        opacity: 1,
        duration: 1.7,
        ease: "bounce.out",
      },
      "-=0.2"
    );

    // Efecto de "impacto" cuando Arena cae
    tl.to(
      [battleRef.current, quizRef.current],
      {
        y: 8,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
      },
      "-=0.3"
    );

    return () => {
      tl.kill();
    };
  }, [onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="splash-screen-container"
    >
      <div className="splash-screen-content">
        {/* Battle */}
        <div
          ref={battleRef}
          className="splash-text splash-battle"
        >
          Battle
        </div>

        {/* Quiz */}
        <div
          ref={quizRef}
          className="splash-text splash-quiz"
        >
          Quiz
        </div>

        {/* Arena */}
        <div
          ref={arenaRef}
          className="splash-text splash-arena"
        >
          Arena
        </div>

        {/* Efecto de brillo de fondo */}
        <div className="splash-glow" />
      </div>
    </div>
  );
};

export default SplashScreen;
