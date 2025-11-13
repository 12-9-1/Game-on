#!/usr/bin/env python3
"""
Script para actualizar Game.jsx con soporte para 50/50 power effect
"""

# Leer el archivo original
with open('frontend/src/pages/Game.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Agregar import de PowersPanel
old_imports = """import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Game.css';"""

new_imports = """import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PowersPanel from '../components/PowersPanel';
import './Game.css';"""

content = content.replace(old_imports, new_imports)

# 2. Agregar estados para powers y hiddenOptions
old_states = """  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);"""

new_states = """  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [powers, setPowers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState([]);"""

content = content.replace(old_states, new_states)

# 3. Agregar handling de poderes en new_question
old_new_question = """    socket.on('new_question', (data) => {
      console.log('Nueva pregunta recibida:', data);
      setQuestion(data);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(data.time_limit || 30);
      setPlayersAnswered(0);
      setTotalPlayers(currentLobby.players?.length || 0);
      setLoading(false);
    });"""

new_new_question = """    socket.on('new_question', (data) => {
      console.log('Nueva pregunta recibida:', data);
      setQuestion(data);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(data.time_limit || 30);
      setPlayersAnswered(0);
      setTotalPlayers(currentLobby.players?.length || 0);
      setHiddenOptions([]);
      setLoading(false);
      
      if (data.powers) {
        setPowers(data.powers);
      }
    });"""

content = content.replace(old_new_question, new_new_question)

# 4. Agregar event listeners para poderes
old_returned_to_lobby = """    socket.on('returned_to_lobby', (data) => {
      console.log('Volviendo al lobby:', data);
      // Resetear todos los estados del juego
      setQuestion(null);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setRoundEnded(false);
      setResults([]);
      setWaitingNewRound(false);
      setLoading(false);
      // Navegar al lobby (la ruta correcta según App.jsx)
      navigate('/');
    });

    return () => {"""

new_returned_to_lobby = """    socket.on('returned_to_lobby', (data) => {
      console.log('Volviendo al lobby:', data);
      // Resetear todos los estados del juego
      setQuestion(null);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setRoundEnded(false);
      setResults([]);
      setWaitingNewRound(false);
      setLoading(false);
      // Navegar al lobby (la ruta correcta según App.jsx)
      navigate('/');
    });

    // Escuchar eventos de poderes
    socket.on('power_used', (data) => {
      console.log('Poder usado:', data);
      if (data.success) {
        setMyScore(data.new_points);
        if (data.effect) {
          if (data.effect.type === 'fifty_fifty') {
            // Ocultar 2 opciones incorrectas aleatorias
            const wrongAnswers = [];
            for (let i = 0; i < question.options.length; i++) {
              if (i !== data.effect.correct_index) {
                wrongAnswers.push(i);
              }
            }
            // Seleccionar 2 opciones incorrectas aleatorias para ocultar
            const toHide = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
            setHiddenOptions(toHide);
          } else if (data.effect.type === 'time_boost') {
            setTimeLeft(prev => prev + data.effect.added_time);
          }
        }
        // Actualizar powers para marcar como usado
        const updatedPowers = powers.map(p => 
          p.power_type === data.power_type ? { ...p, is_used: true } : p
        );
        setPowers(updatedPowers);
      }
    });

    socket.on('power_error', (data) => {
      console.error('Error de poder:', data);
    });

    return () => {"""

content = content.replace(old_returned_to_lobby, new_returned_to_lobby)

# 5. Agregar power_used y power_error al cleanup
old_cleanup = """    return () => {
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('player_answered');
      socket.off('round_ended');
      socket.off('waiting_new_round');
      socket.off('new_round_started');
      socket.off('player_ready_changed');
      socket.off('returned_to_lobby');
    };"""

new_cleanup = """    return () => {
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('player_answered');
      socket.off('round_ended');
      socket.off('waiting_new_round');
      socket.off('new_round_started');
      socket.off('player_ready_changed');
      socket.off('returned_to_lobby');
      socket.off('power_used');
      socket.off('power_error');
    };"""

content = content.replace(old_cleanup, new_cleanup)

# 6. Agregar handler para usar poderes
old_handle_answer = """  const handleAnswerClick = (index) => {
    if (hasAnswered || !socket) return;

    setSelectedAnswer(index);
    setHasAnswered(true);

    socket.emit('submit_answer', { answer_index: index });
  };

  const handleNewRound = () => {"""

new_handle_answer = """  const handleAnswerClick = (index) => {
    if (hasAnswered || !socket) return;

    setSelectedAnswer(index);
    setHasAnswered(true);

    socket.emit('submit_answer', { answer_index: index });
  };

  const handlePowerUsed = (powerType) => {
    if (!socket) return;
    socket.emit('use_power', {
      power_type: powerType,
      current_points: myScore
    });
  };

  const handleNewRound = () => {"""

content = content.replace(old_handle_answer, new_handle_answer)

# 7. Agregar PowersPanel en el render - ANTES de players-status
old_render = """        </div>

        <div className="players-status">"""

new_render = """        </div>

        {/* Poderes como logos abajo */}
        <PowersPanel powers={powers} playerPoints={myScore} onPowerUsed={handlePowerUsed} disabled={hasAnswered} />

        <div className="players-status">"""

content = content.replace(old_render, new_render)

# 8. Modificar options-grid para ocultar opciones con 50/50
old_options = """        <div className="options-grid">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answerResult && index === answerResult.correct_answer;
            const isWrong = answerResult && isSelected && !answerResult.is_correct;

            let className = 'option-button';
            if (hasAnswered) {
              if (isCorrect) className += ' correct';
              else if (isWrong) className += ' wrong';
              else className += ' disabled';
            } else if (isSelected) {
              className += ' selected';
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleAnswerClick(index)}
                disabled={hasAnswered}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {hasAnswered && isCorrect && <span className="check-mark">✓</span>}
                {hasAnswered && isWrong && <span className="x-mark">✗</span>}
              </button>
            );
          })}
        </div>"""

new_options = """        <div className="options-grid">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answerResult && index === answerResult.correct_answer;
            const isWrong = answerResult && isSelected && !answerResult.is_correct;
            const isHidden = hiddenOptions.includes(index);

            let className = 'option-button';
            if (isHidden) {
              className += ' hidden';
            }
            if (hasAnswered) {
              if (isCorrect) className += ' correct';
              else if (isWrong) className += ' wrong';
              else className += ' disabled';
            } else if (isSelected) {
              className += ' selected';
            }

            if (isHidden) return null;

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleAnswerClick(index)}
                disabled={hasAnswered}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {hasAnswered && isCorrect && <span className="check-mark">✓</span>}
                {hasAnswered && isWrong && <span className="x-mark">✗</span>}
              </button>
            );
          })}
        </div>"""

content = content.replace(old_options, new_options)

# Escribir el archivo actualizado
with open('frontend/src/pages/Game.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Game.jsx actualizado correctamente con soporte para 50/50 power')
