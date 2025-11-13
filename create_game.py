code = """import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PowersPanel from '../components/PowersPanel';
import { PowersManager } from '../utils/powersManager';
import './Game.css';

function Game({ socket, currentLobby }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [powers, setPowers] = useState([]);
  const [powersManager, setPowersManager] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !currentLobby) {
      navigate('/');
      return;
    }

    socket.on('new_question', (data) => {
      setQuestion(data);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(data.time_limit || 30);
      setLoading(false);
      
      if (data.powers) {
        setPowers(data.powers);
        const mgr = new PowersManager(myScore);
        mgr.initializePowers(data.powers);
        setPowersManager(mgr);
      }
    });

    socket.on('answer_result', (data) => {
      setAnswerResult(data);
      if (data.total_score !== undefined) {
        setMyScore(data.total_score);
      }
    });

    socket.on('power_used', (data) => {
      if (data.success) {
        setMyScore(data.new_points);
        if (data.effect && data.effect.type === 'time_boost') {
          setTimeLeft(prev => prev + data.effect.added_time);
        }
      }
    });

    socket.on('power_error', (data) => {
      console.error('Error de poder:', data);
    });

    return () => {
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('power_used');
      socket.off('power_error');
    };
  }, [socket, currentLobby, navigate, powersManager]);

  const handleAnswerClick = (index) => {
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

  if (loading) {
    return <div className="game-container"><p>Cargando...</p></div>;
  }

  if (!question) {
    return <div className="game-container"><p>Sin pregunta</p></div>;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <span>Pregunta #{question.question_number}</span>
        <span>Puntaje: {myScore}</span>
        <span>{timeLeft}s</span>
      </div>
      <PowersPanel powers={powers} playerPoints={myScore} onPowerUsed={handlePowerUsed} disabled={hasAnswered} />
      <div className="question-card">
        <h2>{question.question}</h2>
        <div className="options-grid">
          {question.options.map((option, index) => (
            <button key={index} onClick={() => handleAnswerClick(index)} disabled={hasAnswered}>
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Game;
"""

with open('frontend/src/pages/Game.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Game.jsx creado exitosamente')
