import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../state/AuthContext'
import { getSocket } from '../../api/socket'

export default function AdminChat() {
    const { user } = useAuth()
    const [teachers, setTeachers] = useState([])
    const [active, setActive] = useState(null) // { type: 'direct'|'broadcast_teachers', id, name }
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const bottomRef = useRef(null)

    useEffect(() => {
        // Fetch all teachers
        api.get('/api/admin/all-users').then(({ data }) => {
            const teacherList = data.filter(u => u.role === 'teacher');
            setTeachers(teacherList);
            if (teacherList.length > 0) {
                // Default to broadcast? or first teacher? Let's default to Broadcast
                setActive({ type: 'broadcast_teachers', id: null, name: 'All Guides' })
            }
        })
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
            if (active?.type === 'broadcast_teachers') {
                if (msg.roomType !== 'broadcast' || msg.roomId !== 'broadcast:teachers') return
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
                try {
                    const { data } = await api.get(`/api/chat/direct/${active.id}`)
                    setMessages(data)
                } catch (e) { console.error(e) }
            } else {
                try {
                    const { data } = await api.get('/api/chat/broadcast') // Controller handles admin role to return broadcast:teachers
                    setMessages(data)
                } catch (e) { console.error(e) }
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

        let payload;
        if (active.type === 'direct') {
            payload = { toUserId: active.id, text, mode: 'direct' }
        } else {
            payload = { text, mode: 'broadcast_teachers' }
        }

        socket.emit('chat:send', payload)
        setText('')
    }

    return (
        <div className="h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 border-r p-3 space-y-3 bg-white">
                    <div className="font-semibold px-2">Guides (Teachers)</div>

                    <button
                        className={`w-full text-left px-2 py-2 rounded flex items-center gap-2 ${active?.type === 'broadcast_teachers' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                        onClick={() => setActive({ type: 'broadcast_teachers', id: null, name: 'All Guides' })}
                    >
                        <span>📢</span>
                        <span>Broadcast to Guides</span>
                    </button>

                    <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                        {teachers.map(t => (
                            <button
                                key={t._id}
                                className={`w-full text-left px-2 py-2 rounded flex items-center gap-2 ${active?.type === 'direct' && active.id === t._id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                                onClick={() => setActive({ type: 'direct', id: t._id, name: t.name })}
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <div>
                                    <div className="font-medium">{t.name}</div>
                                    <div className="text-xs opacity-70 truncate">{t.email}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col">
                    <div className="border-b px-6 py-4 bg-gray-50 flex items-center justify-between">
                        <div className="font-semibold text-lg">{active?.name || 'Select conversation'}</div>
                        {active?.type === 'broadcast_teachers' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Admin Announcement Channel</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                        {messages.map(m => {
                            const senderId = m.senderId?._id || m.senderId
                            const isMine = senderId === user.id
                            return (
                                <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl max-w-md text-sm shadow-sm ${isMine ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                        {m.text}
                                        <div className={`text-[10px] mt-1 ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-4 border-t flex gap-3 bg-white">
                        <input
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                            placeholder={active?.type === 'broadcast_teachers' ? "Type an announcement for all guides..." : "Type a message..."}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                        />
                        <button
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
                            onClick={send}
                        >
                            Send
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
