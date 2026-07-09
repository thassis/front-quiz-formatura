import { useEffect, useRef, useState } from 'react'
import './App.css'

const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'

function App() {
  const socketRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [messages, setMessages] = useState([])
  const [outgoingMessage, setOutgoingMessage] = useState('')

  useEffect(() => {
    const socket = new WebSocket(websocketUrl)
    socketRef.current = socket

    socket.addEventListener('open', () => {
      setConnectionStatus('Connected')
    })

    socket.addEventListener('close', () => {
      setConnectionStatus('Disconnected')
    })

    socket.addEventListener('error', () => {
      setConnectionStatus('Connection error')
    })

    socket.addEventListener('message', (event) => {
      setMessages((current) => [...current, event.data])
    })

    return () => {
      socket.close()
    }
  }, [])

  const sendMessage = (event) => {
    event.preventDefault()

    if (!outgoingMessage.trim()) {
      return
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(outgoingMessage)
      setOutgoingMessage('')
    }
  }

  return (
    <main className="app">
      <h1>WebSocket Quiz Client</h1>
      <p>
        Server: <code>{websocketUrl}</code>
      </p>
      <p className="status">Status: {connectionStatus}</p>

      <form onSubmit={sendMessage} className="composer">
        <input
          type="text"
          value={outgoingMessage}
          onChange={(event) => setOutgoingMessage(event.target.value)}
          placeholder="Type a message"
          aria-label="Message"
        />
        <button type="submit">Send</button>
      </form>

      <section className="messages" aria-live="polite">
        <h2>Incoming messages</h2>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul>
            {messages.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
