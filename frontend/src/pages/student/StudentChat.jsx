import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import { getSocket } from '../../api/socket'

export default function StudentChat() {
  const { user } = useAuth()
  const [guide, setGuide] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const loadGuide = async () => {
      const { data } = await api.get('/api/student/guide')
      setGuide(data)
    }
    loadGuide()
  }, [])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    const socket = getSocket(token)

    const handler = (msg) => {
      if (guide && msg.roomType === 'direct') {
        if (!(msg.senderId === guide._id || msg.receiverId === guide._id)) return
      }
      if (msg.roomType === 'broadcast') {
        // all broadcasts from guide are relevant
      }
      setMessages(prev => [...prev, msg])
    }
    socket.on('chat:message', handler)
    return () => {
      socket.off('chat:message', handler)
    }
  }, [user, guide])

  useEffect(() => {
    if (!guide) return
    const load = async () => {
      const { data: direct } = await api.get(`/api/chat/direct/${guide._id}`)
      const { data: broadcast } = await api.get('/api/chat/broadcast')
      setMessages([...direct, ...broadcast].sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt)))
    }
    load()
  }, [guide])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!text.trim() || !guide) return
    const token = localStorage.getItem('token')
    const socket = getSocket(token)
    socket.emit('chat:send', { toUserId: guide._id, text, mode: 'direct' })
    setText('')
  }

  if (!guide) {
    return (
      <div>
        <Navbar />
        <div className="max-w-xl mx-auto p-4">
          <div className="font-semibold mb-2">Chat</div>
          <div className="text-sm text-gray-600">No guide allocated yet. Once admin assigns a guide, you can start chatting here.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2 bg-gray-50 font-semibold">Chat with {guide.name}</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
          {messages.map(m => {
            const senderId = m.senderId?._id || m.senderId
            const isMine = senderId === user.id
            return (
            <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg max-w-md text-sm ${isMine ? 'bg-gray-900 text-white' : 'bg-white border'}`}>
                {m.text}
                <div className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          )})}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t flex gap-2 bg-white">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Type a message"
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); send() } }}
          />
          <button className="px-4 py-2 bg-gray-900 text-white rounded text-sm" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  )
}
