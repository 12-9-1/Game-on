import { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { GiHamburgerMenu } from "react-icons/gi";
import "./GameSidebar.css";

function GameSidebar({ socket, lobby, mySocketId }) {
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState("ranking");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Actualizar jugadores cuando cambia el lobby
  useEffect(() => {
    if (lobby?.players) {
      const sortedPlayers = [...lobby.players].sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA;
      });
      setPlayers(sortedPlayers);
    }
  }, [lobby]);

  // Escuchar mensajes de chat
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("chat_message", handleChatMessage);

    return () => {
      socket.off("chat_message", handleChatMessage);
    };
  }, [socket]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socket) return;

    const player = lobby?.players?.find((p) => p.socket_id === mySocketId);
    if (player) {
      socket.emit("send_chat_message", {
        message: messageInput.trim(),
        player_name: player.name,
      });
      setMessageInput("");
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  // Renderizar contenido del ranking
  const renderRanking = () => (
    <div className="ranking-section">
      <h3 className="ranking-title">Puntuaciones</h3>
      <div className="players-ranking">
        {players.length === 0 ? (
          <div className="ranking-empty">
            <p>No hay jugadores</p>
          </div>
        ) : (
          players.map((player, index) => {
            const isMe = player.socket_id === mySocketId;
            return (
              <div
                key={player.socket_id}
                className={`ranking-item ${isMe ? "my-player" : ""} ${
                  index === 0 ? "first-place" : ""
                }`}
              >
                <div className="ranking-rank">{getRankIcon(index)}</div>
                <div className="ranking-player-info">
                  <div className="ranking-player-name">
                    {player.name}
                    {player.is_host && " 👑"}
                    {isMe && " (Tú)"}
                  </div>
                  <div className="ranking-player-score">
                    {player.score?.toLocaleString() || 0} pts
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Renderizar contenido del chat
  const renderChat = () => (
    <div className="chat-section">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No hay mensajes aún</p>
            <p className="chat-empty-hint">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.socket_id === mySocketId;
            return (
              <div
                key={index}
                className={`chat-message ${isMe ? "my-message" : ""}`}
              >
                <div className="chat-message-header">
                  <span className="chat-message-author">
                    {isMe ? "Tú" : msg.player_name}
                  </span>
                  <span className="chat-message-time">
                    {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="chat-message-text">{msg.message}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Escribe un mensaje..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          maxLength={200}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!messageInput.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="game-sidebar">
        <div className="sidebar-tabs">
          <button
            className={`tab-button ${activeTab === "ranking" ? "active" : ""}`}
            onClick={() => setActiveTab("ranking")}
          >
            📊 Ranking
          </button>
          <button
            className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            💬 Chat
          </button>
        </div>
        <div className="sidebar-content">
          {activeTab === "ranking" ? renderRanking() : renderChat()}
        </div>
      </div>

      {/* Floating Button Mobile */}
      <button
        className="floating-button"
        onClick={() => setIsModalOpen(true)}
        title="Abrir ranking y chat"
      >
        <GiHamburgerMenu size={28} />
      </button>

      {/* Modal Fullscreen */}
      {isModalOpen && (
        <div className="sidebar-modal-overlay active">
          <div className="sidebar-modal">
            <button
              className="modal-close-button"
              onClick={() => setIsModalOpen(false)}
              title="Cerrar"
            >
              <FiX size={28} />
            </button>
            <div className="sidebar-tabs">
              <button
                className={`tab-button ${
                  activeTab === "ranking" ? "active" : ""
                }`}
                onClick={() => setActiveTab("ranking")}
              >
                📊 Ranking
              </button>
              <button
                className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                💬 Chat
              </button>
            </div>
            <div className="sidebar-content">
              {activeTab === "ranking" ? renderRanking() : renderChat()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GameSidebar;
