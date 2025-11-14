
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./SplashScreen.css";

const SplashScreen = ({ onAnimationComplete }) => {
  const battleRef = useRef(null);
  const quizRef = useRef(null);
  const arenaRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    // Verificar que GSAP esté disponible
    if (!gsap) {
      console.error("GSAP no está disponible");
      onAnimationComplete?.();
      return;
    }

    // Verificar que todas las referencias estén disponibles
    if (!battleRef.current || !quizRef.current || !arenaRef.current || !containerRef.current) {
      console.error("Referencias del DOM no disponibles");
      onAnimationComplete?.();
      return;
    }

    try {
      const tl = gsap.timeline({ 
        defaults: { ease: "power3.out" },
        onComplete: () => {
          // Fade out después de que termine la animación
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.6,
            delay: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
              if (typeof onAnimationComplete === 'function') {
                onAnimationComplete();
              }
            }
          });
        }
      });

      // Guardar referencia del timeline
      timelineRef.current = tl;

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
        "-=0.4"
      );

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
          rotation: 23,
          opacity: 1,
          duration: 1.7,
          ease: "bounce.out",
        },
        "-=0.2"
      );

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

    } catch (error) {
      console.error("Error en animación GSAP:", error);
      // Si hay error, llamar al callback inmediatamente
      if (typeof onAnimationComplete === 'function') {
        onAnimationComplete();
      }
    }

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="splash-screen-container"
    >
      <div className="splash-screen-content">
        <div
          ref={battleRef}
          className="splash-text splash-battle"
        >
          Battle
        </div>

        <div
          ref={quizRef}
          className="splash-text splash-quiz"
        >
          Quiz
        </div>

        <div
          ref={arenaRef}
          className="splash-text splash-arena"
        >
          Arena
        </div>

        <div className="splash-glow" />
      </div>
    </div>
  );
};

export default SplashScreen;