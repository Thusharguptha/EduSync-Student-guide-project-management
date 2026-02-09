import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [allocs, setAllocs] = useState([])
  const [panels, setPanels] = useState([])
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard' or 'bulk-register'

  // Forms state
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student', department: 'MCA' })
  const [showPassword, setShowPassword] = useState(false)
  const [allocForm, setAllocForm] = useState({ studentId: '', teacherId: '' })
  const [panelForm, setPanelForm] = useState({ members: [], students: [], room: '', timeSlot: '' })
  const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users])
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users])

  // Bulk register state
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)

  const fetchAll = async () => {
    const [s1, s2, s3, s4] = await Promise.all([
      api.get('/api/admin/dashboard-stats'),
      api.get('/api/admin/users'),
      api.get('/api/admin/allocations'),
      api.get('/api/admin/panels')
    ])
    setStats(s1.data)
    setUsers(s2.data)
    setAllocs(s3.data)
    setPanels(s4.data || [])
  }

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/all-users')
      setAllUsers(data)
    } catch (error) {
      console.error('Error fetching all users:', error)
    }
  }

  useEffect(() => {
    fetchAll()
    if (activeView === 'bulk-register') {
      fetchAllUsers()
    }
  }, [activeView])

  const createUser = async (e) => {
    e.preventDefault()
    await api.post('/api/admin/users', newUser)
    setNewUser({ name: '', email: '', password: '', role: 'student', department: 'MCA' })
    fetchAll()
  }

  const removeUser = async (id) => {
    await api.delete(`/api/admin/users/${id}`)
    fetchAll()
  }

  const submitAllocation = async (e) => {
    e.preventDefault()
    if (!allocForm.studentId || !allocForm.teacherId) return
    await api.post('/api/admin/allocate', allocForm)
    setAllocForm({ studentId: '', teacherId: '' })
    fetchAll()
  }

  const submitPanel = async (e) => {
    e.preventDefault()
    const body = { ...panelForm, timeSlot: panelForm.timeSlot ? new Date(panelForm.timeSlot) : undefined }
    await api.post('/api/admin/panels', body)
    setPanelForm({ members: [], students: [], room: '', timeSlot: '' })
    fetchAll()
  }

  // Bulk register functions
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setUploadResult(null)
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Please select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/api/admin/bulk-register', formData)
      setUploadResult(data)
      setFile(null)
      alert(`Success: ${data.success} users created, ${data.failed} failed`)
      fetchAllUsers()
    } catch (error) {
      alert('Error uploading file')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'Name,Email,Role,Department\nThushar,thushar@gmail.com,student,MCA\nSanthosh Katti,santhosh@gmail.com,teacher,MCA\nSuresh,suresh@gmail.com,teacher,MCA'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_registration_template.csv'
    a.click()
  }

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
  }

  const handleUpdateUser = async () => {
    try {
      await api.put(`/api/admin/users/${editingUser._id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department
      })
      setEditingUser(null)
      fetchAllUsers()
      alert('User updated successfully')
    } catch (error) {
      alert('Error updating user')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      fetchAllUsers()
      alert('User deleted')
    } catch (error) {
      alert('Error deleting user')
    }
  }

  const chartData = useMemo(() => (
    stats ? [
      { label: 'Students', value: stats.students },
      { label: 'Teachers', value: stats.teachers },
      { label: 'Panels', value: stats.panels },
      { label: 'Projects', value: stats.projects },
    ] : []
  ), [stats])

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/80">Manage users, monitor system overview, and analytics</p>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${activeView === 'dashboard' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:bg-white/10'
              }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveView('bulk-register')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${activeView === 'bulk-register' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:bg-white/10'
              }`}
          >
            📤 Bulk Register
          </button>
        </div>

        {/* Original Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">System Overview</h2>
                  <p className="text-gray-600 text-sm">Platform statistics and analytics</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickLine={{ stroke: '#d1d5db' }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#667eea" />
                          <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                      </defs>
                      <Bar dataKey="value" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderRadius: 12,
                          border: '1px solid rgba(148, 163, 184, 0.5)',
                          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.6)'
                        }}
                        labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
                        itemStyle={{ color: '#e5e7eb', fontSize: 12 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">User Management</h2>
                  <p className="text-gray-600 text-sm">Create new users for the platform</p>
                </div>
                <form onSubmit={createUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Enter full name"
                        value={newUser.name}
                        onChange={e => setNewUser(v => ({ ...v, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Enter email address"
                        value={newUser.email}
                        onChange={e => setNewUser(v => ({ ...v, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="Enter password"
                          value={newUser.password}
                          onChange={e => setNewUser(v => ({ ...v, password: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        value={newUser.role}
                        onChange={e => setNewUser(v => ({ ...v, role: e.target.value }))}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>
                    <div className="col-span-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="e.g., Computer Science"
                        value={newUser.department}
                        onChange={e => setNewUser(v => ({ ...v, department: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg py-3 px-4 font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Create User
                  </button>
                </form>
              </div>
            </div>

            {/* Guide Allocation and Panels */}

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Guide Allocation</h2>
                  <p className="text-gray-600 text-sm">Assign students to their project guides</p>
                </div>
                <form onSubmit={submitAllocation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      value={allocForm.studentId}
                      onChange={e => setAllocForm(v => ({ ...v, studentId: e.target.value }))}
                      required
                    >
                      <option value="">Choose a student</option>
                      {students.map(s => <option key={s._id} value={s._id}>{s.name} - {s.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      value={allocForm.teacherId}
                      onChange={e => setAllocForm(v => ({ ...v, teacherId: e.target.value }))}
                      required
                    >
                      <option value="">Choose a teacher</option>
                      {teachers.map(t => <option key={t._id} value={t._id}>{t.name} - {t.email}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg py-3 px-4 font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Assign Guide
                  </button>
                </form>
              </div>

              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Panel</h2>
                  <p className="text-gray-600 text-sm">Set up evaluation panels for projects</p>
                </div>
                <form onSubmit={submitPanel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter room number"
                      value={panelForm.room}
                      onChange={e => setPanelForm(v => ({ ...v, room: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      type="datetime-local"
                      value={panelForm.timeSlot}
                      onChange={e => setPanelForm(v => ({ ...v, timeSlot: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Panel Members (Teachers)</label>
                    <select
                      multiple
                      className="w-full h-32 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      value={panelForm.members}
                      onChange={e =>
                        setPanelForm(v => ({ ...v, members: Array.from(e.target.selectedOptions).map(o => o.value) }))
                      }
                    >
                      {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
                    <select
                      multiple
                      className="w-full h-32 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      value={panelForm.students}
                      onChange={e =>
                        setPanelForm(v => ({ ...v, students: Array.from(e.target.selectedOptions).map(o => o.value) }))
                      }
                    >
                      {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg py-3 px-4 font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Create Panel
                  </button>
                </form>
              </div>
            </section>

            {/* Available Panels */}
            <section className="space-y-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Available Panels</h2>
                  <p className="text-gray-600 text-sm">All created evaluation panels</p>
                </div>
                <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left font-semibold text-gray-700">Room</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Date & Time</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Members</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Students</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800">
                      {panels.map(panel => (
                        <tr key={panel._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-medium">{panel.room || 'N/A'}</td>
                          <td className="p-4 text-gray-600">
                            {panel.timeSlot ? new Date(panel.timeSlot).toLocaleString() : 'Not set'}
                          </td>
                          <td className="p-4">
                            <div className="text-gray-600">
                              {panel.members && panel.members.length > 0 ? (
                                <span className="text-xs">
                                  {panel.members.map(m => m.name || m).join(', ')}
                                </span>
                              ) : 'No members'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-600">
                              {panel.students && panel.students.length > 0 ? (
                                <span className="text-xs">
                                  {panel.students.map(s => s.name || s).join(', ')}
                                </span>
                              ) : 'No students'}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {panels.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-gray-500">
                            <div className="text-4xl mb-2">📋</div>
                            <p>No panels created yet</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Current Allocations</h2>
                  <p className="text-gray-600 text-sm">View student-teacher assignments</p>
                </div>
                <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left font-semibold text-gray-700">Student</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Assigned Teacher</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800">
                      {allocs.map(a => (
                        <tr key={a._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-medium">{a.studentId?.name}</td>
                          <td className="p-4 text-gray-600">{a.teacherId?.name}</td>
                        </tr>
                      ))}
                      {allocs.length === 0 && (
                        <tr>
                          <td colSpan="2" className="p-8 text-center text-gray-500">
                            <div className="text-4xl mb-2">👥</div>
                            <p>No allocations yet</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Bulk Register View */}
        {activeView === 'bulk-register' && (
          <div className="space-y-6">
            {/* Bulk Upload Section */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk User Registration</h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Excel Format</h3>
                <p className="text-sm text-blue-700 mb-2">Your Excel file must have these columns:</p>
                <div className="bg-white rounded p-3 text-sm font-mono">
                  <div className="grid grid-cols-4 gap-4 font-bold text-gray-700 border-b pb-2">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Department</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-gray-600 pt-2">
                    <span>Thushar</span>
                    <span>thushar@gmail.com</span>
                    <span>student</span>
                    <span>MCA</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">Password: First 4 letters of name + @123 (e.g., John → John@123)</p>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-lg font-medium text-gray-700">
                      {file ? file.name : 'Click to upload Excel file'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Supports .xlsx, .xls, .csv</p>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    📥 Download Template
                  </button>
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="flex-1 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : '✓ Upload & Register'}
                  </button>
                </div>
              </form>

              {uploadResult && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Upload Results</h3>
                  <p className="text-green-700">Success: {uploadResult.success} users created</p>
                  <p className="text-red-700">Failed: {uploadResult.failed} users</p>
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-700">Errors:</p>
                      {uploadResult.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600">Row {err.row}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Management Table */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Role</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Department</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(user => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">{user.department || '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit User</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Email"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Department"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
