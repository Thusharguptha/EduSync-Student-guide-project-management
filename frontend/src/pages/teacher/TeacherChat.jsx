import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import { getSocket } from '../../api/socket'

export default function TeacherChat() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [active, setActive] = useState(null) // { type: 'direct'|'broadcast', id, name }
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/api/teacher/students').then(({data})=>{
      setStudents(data)
      if (data[0]) setActive({ type: 'direct', id: data[0].studentId._id, name: data[0].studentId.name })
    })
    api.get('/api/chat/broadcast').then(({data})=>{})
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
      if (active.type === 'direct') {
        const { data } = await api.get(`/api/chat/direct/${active.id}`)
        setMessages(data)
      } else {
        const { data } = await api.get('/api/chat/broadcast')
        setMessages(data)
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
    const payload = active.type === 'direct'
      ? { toUserId: active.id, text, mode: 'direct' }
      : { text, mode: 'broadcast' }
    socket.emit('chat:send', payload)
    setText('')
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r p-3 space-y-3 bg-white">
          <div className="font-semibold">Students</div>
          <button
            className={`w-full text-left px-2 py-1 rounded ${active?.type==='broadcast' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
            onClick={()=>setActive({ type: 'broadcast', id: null, name: 'All Students' })}
          >Broadcast to all</button>
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {students.map(a => (
              <button
                key={a._id}
                className={`w-full text-left px-2 py-1 rounded ${active?.type==='direct' && active.id===a.studentId._id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                onClick={()=>setActive({ type: 'direct', id: a.studentId._id, name: a.studentId.name })}
              >{a.studentId.name}</button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 bg-gray-50 font-semibold">Chat - {active?.name || 'Select conversation'}</div>
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
        </main>
      </div>
    </div>
  )
}
