import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import { getSocket } from '../../api/socket'

export default function TeacherChat() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [admins, setAdmins] = useState([])
  const [active, setActive] = useState(null) // { type: 'direct'|'broadcast'|'broadcast_teachers', id, name }
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: studs } = await api.get('/api/teacher/students')
      setStudents(studs)

      try {
        const { data: adms } = await api.get('/api/teacher/admins')
        setAdmins(adms)
      } catch (e) { console.error(e) }

      if (studs[0]) setActive({ type: 'direct', id: studs[0].studentId._id, name: studs[0].studentId.name })
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    const socket = getSocket(token)

    const handler = (msg) => {
      // filter messages relevant to current chat
      if (active?.type === 'direct') {
        if (msg.roomType !== 'direct') return
        if (!(msg.senderId === active.id || msg.receiverId === active.id)) return
      }
      if (active?.type === 'broadcast') {
        if (msg.roomType !== 'broadcast') return
        if (msg.roomId !== `broadcast:${user.id}`) return
      }
      if (active?.type === 'broadcast_teachers') {
        if (msg.roomId !== 'broadcast:teachers') return
      }
      setMessages(prev => [...prev, msg])
    }
    socket.on('chat:message', handler)
    return () => {
      socket.off('chat:message', handler)
    }
  }, [user, active])

  useEffect(() => {
    if (!active) return
    const load = async () => {
      try {
        if (active.type === 'direct') {
          const { data } = await api.get(`/api/chat/direct/${active.id}`)
          setMessages(data)
        } else if (active.type === 'broadcast') {
          const { data } = await api.get('/api/chat/broadcast')
          setMessages(data)
        } else if (active.type === 'broadcast_teachers') {
          const { data } = await api.get('/api/chat/broadcast?source=admin')
          setMessages(data)
        }
      } catch (e) {
        console.error(e)
        setMessages([])
      }
    }
    load()
  }, [active])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!text.trim()) return
    const token = localStorage.getItem('token')
    const socket = getSocket(token)

    // Teachers cannot send to broadcast_teachers (it's admin only channel)
    if (active.type === 'broadcast_teachers') return

    const payload = active.type === 'direct'
      ? { toUserId: active.id, text, mode: 'direct' }
      : { text, mode: 'broadcast' } // broadcast to students
    socket.emit('chat:send', payload)
    setText('')
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r p-3 space-y-3 bg-white overflow-y-auto">

          {/* Admin Messaging Section */}
          <div className="font-semibold px-2 text-purple-700">Admin</div>
          <button
            className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${active?.type === 'broadcast_teachers' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActive({ type: 'broadcast_teachers', id: null, name: 'Admin Announcements' })}
          >
            <span>📢</span> Announcements
          </button>

          {admins.map(a => (
            <button
              key={a._id}
              className={`w-full text-left px-2 py-1 rounded ${active?.type === 'direct' && active.id === a._id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActive({ type: 'direct', id: a._id, name: a.name })}
            >
              {a.name} (Admin)
            </button>
          ))}

          <hr className="border-gray-200" />

          {/* Student Messaging Section */}
          <div className="font-semibold px-2">Students</div>
          <button
            className={`w-full text-left px-2 py-1 rounded ${active?.type === 'broadcast' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setActive({ type: 'broadcast', id: null, name: 'Broadcast to Students' })}
          >Broadcast to Students</button>

          <div className="space-y-1">
            {students.map(a => (
              <button
                key={a._id}
                className={`w-full text-left px-2 py-1 rounded ${active?.type === 'direct' && active.id === a.studentId._id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setActive({ type: 'direct', id: a.studentId._id, name: a.studentId.name })}
              >{a.studentId.name}</button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 bg-gray-50 font-semibold flex justify-between items-center">
            <span>Chat - {active?.name || 'Select conversation'}</span>
            {active?.type === 'broadcast_teachers' && <span className="text-xs text-gray-500">(Read Only)</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
            {messages.map(m => {
              const senderId = m.senderId?._id || m.senderId
              const isMine = senderId === user.id
              const isAdmin = admins.find(a => a._id === senderId)

              return (
                <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-md text-sm ${isMine ? 'bg-gray-900 text-white' : isAdmin ? 'bg-purple-100 border border-purple-200 text-purple-900' : 'bg-white border'}`}>
                    {isAdmin && <div className="text-[10px] font-bold mb-1 opacity-70">Admin</div>}
                    {m.text}
                    <div className={`text-[10px] mt-1 ${isMine ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area - Hidden for Read-Only Channels */}
          {active?.type !== 'broadcast_teachers' && (
            <div className="p-3 border-t flex gap-2 bg-white">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Type a message"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
              />
              <button className="px-4 py-2 bg-gray-900 text-white rounded text-sm" onClick={send}>Send</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
