import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function TeacherDashboard() {
  const [students, setStudents] = useState([])
  const [projects, setProjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [progressData, setProgressData] = useState([])
  const [activeTab, setActiveTab] = useState('projects')
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedAssignmentForSubs, setSelectedAssignmentForSubs] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [submissionStats, setSubmissionStats] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' })
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    instructions: '',
    category: 'assignment'
  })

  const fetchData = async () => {
    try {
      const [studentsRes, projectsRes, assignmentsRes, progressRes] = await Promise.all([
        api.get('/api/teacher/students'),
        api.get('/api/teacher/projects'),
        api.get('/api/teacher/assignments'),
        api.get('/api/teacher/student-progress')
      ])
      setStudents(studentsRes.data)
      setProjects(projectsRes.data)
      setAssignments(assignmentsRes.data)
      setProgressData(progressRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/api/templates')
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  useEffect(() => {
    fetchData()
    fetchTemplates()
  }, [])

  const createAssignment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/teacher/assignments', newAssignment)
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
        instructions: '',
        category: 'assignment'
      })
      setShowAssignmentForm(false)
      fetchData()
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const updateDueDate = async (studentId, dueDate) => {
    try {
      await api.post('/api/teacher/update-due-date', { studentId, dueDate })
      fetchData()
    } catch (error) {
      console.error('Error updating due date:', error)
    }
  }

  const viewSubmissions = async (assignment) => {
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get(`/api/teacher/assignments/${assignment._id}/submissions`),
        api.get(`/api/teacher/assignments/${assignment._id}/stats`)
      ])
      setSubmissions(subsRes.data)
      setSubmissionStats(statsRes.data)
      setSelectedAssignmentForSubs(assignment)
      setShowSubmissionsModal(true)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const openGradingModal = (submission) => {
    setSelectedSubmission(submission)
    setGradeData({
      score: submission.score || '',
      feedback: submission.feedback || ''
    })
    setShowGradingModal(true)
  }

  const gradeSubmission = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/teacher/submissions/${selectedSubmission._id}/grade`, gradeData)
      setShowGradingModal(false)
      if (selectedAssignmentForSubs) {
        viewSubmissions(selectedAssignmentForSubs) // Refresh submissions
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert(error.response?.data?.message || 'Error grading submission')
    }
  }

  const openTemplateSelector = (student) => {
    setSelectedStudent(student)
    setShowTemplateModal(true)
    setSelectedTemplate(null)
  }

  const applyTemplate = async () => {
    if (!selectedTemplate || !selectedStudent) return

    try {
      await api.post('/api/student/apply-template', {
        studentId: selectedStudent.studentId._id,
        templateId: selectedTemplate._id,
        projectDueDate: selectedStudent.project?.dueDate
      })

      setShowTemplateModal(false)
      fetchData() // Refresh progress data
      alert('Template applied successfully!')
    } catch (error) {
      console.error('Error applying template:', error)
      alert('Failed to apply template')
    }
  }

  const handleApproveProject = async (project, approve) => {
    // Check for title clash and show confirmation
    if (approve && project.titleClash) {
      const confirmMessage = `⚠️ WARNING: This project has a similar title to other projects in the system.\n\nProject: "${project.title}"\n\nThis might indicate duplicate work or plagiarism. Are you sure you want to approve this project?`;

      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }
    }

    try {
      await api.post('/api/teacher/approve-project', {
        studentId: project.studentId._id,
        approve
      });
      fetchData();
    } catch (error) {
      console.error('Error approving project:', error);
      alert(error.response?.data?.message || 'Error processing request');
    }
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
          <p className="text-white/80">Manage students, projects, and assignments</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
          {[
            { id: 'projects', label: 'Projects', icon: '📋' },
            { id: 'progress', label: 'Student Progress', icon: '📊' },
            { id: 'assignments', label: 'Assignments', icon: '📝' },
            { id: 'students', label: 'Students', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-xl ${activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-lg transform scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'projects' && (
          <section className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Projects</h2>
                <p className="text-gray-600 text-sm">Review and manage student project submissions</p>
              </div>
              <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-gray-700">Student</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Title</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="p-4 text-left font-semibold text-gray-700">File</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {projects.map(p => (
                      <tr key={p._id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="p-4 font-medium">{p.studentId?.name}</td>
                        <td className="p-4 max-w-xs">
                          <div className="font-medium text-gray-900">{p.title}</div>
                          <div className="text-xs text-gray-500 truncate">{p.abstract}</div>
                        </td>
                        
                        <td className="p-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.status === 'approved' ? 'bg-green-100 text-green-700' :
                            p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              p.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.fileUrl ? (
                            <a
                              className="text-blue-600 hover:text-blue-700 underline font-medium"
                              href={p.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📄 View File
                            </a>
                          ) : (
                            <span className="text-gray-400">No file</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {p.status === 'submitted' && (
                              <>
                                <button
                                  className="rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium transition"
                                  onClick={() => handleApproveProject(p, true)}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  className="rounded-lg bg-red-100 hover:bg-red-200 border border-red-200 px-3 py-1 text-xs text-red-700 font-medium transition"
                                  onClick={() => handleApproveProject(p, false)}
                                >
                                  ✗ Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Progress Tracker</h2>
                <p className="text-gray-600 text-sm">Monitor all student project progress and milestones</p>
              </div>
              <div className="grid gap-6">
                {progressData.map((data, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{data.student?.name}</h3>
                        <p className="text-sm text-gray-600">{data.student?.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{data.overallProgress}%</div>
                        <div className="text-xs text-gray-500">Overall Progress</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 font-medium">
                          Project: {data.project?.title || 'Not started'}
                          {data.project?.titleClash && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              ⚠️ Similar title detected
                            </span>
                          )}
                        </span>
                        <span className="text-gray-500">
                          {data.project?.dueDate ? `Due: ${new Date(data.project.dueDate).toLocaleDateString()}` : 'No due date'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${data.overallProgress}%`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        ></div>
                      </div>
                    </div>

                    {data.progress?.milestones && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.progress.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex flex-col gap-2 text-xs bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{milestone.title}</span>
                              <span className="text-gray-500">({milestone.progress}%)</span>
                            </div>
                            {milestone.fileUrl && (
                              <div className="flex flex-col gap-1">
                                <a href={milestone.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                  📄 View Document
                                </a>
                                {!milestone.approvedByTeacher ? (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.post('/api/teacher/approve-milestone', {
                                          studentId: data.student?._id || data.studentId?._id,
                                          milestoneIndex: idx
                                        })
                                        fetchData()
                                        alert('Approved!')
                                      } catch (error) {
                                        console.error('Approval error:', error)
                                        alert(error.response?.data?.message || 'Error approving')
                                      }
                                    }}
                                    className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                                  >
                                    ✓ Approve
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">✓ Approved</span>
                                )}
                              </div>
                            )}
                            {!milestone.fileUrl && idx > 0 && (
                              <span className="text-gray-400 text-xs">No document yet</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'assignments' && (
          <section className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Assignment Management</h2>
                  <p className="text-gray-600 text-sm">Create and manage assignments for your students</p>
                </div>
                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="rounded-xl px-6 py-3 text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  + Create Assignment
                </button>
              </div>

              {showAssignmentForm && (
                <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <form onSubmit={createAssignment} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="Enter assignment title"
                          value={newAssignment.title}
                          onChange={e => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          value={newAssignment.dueDate}
                          onChange={e => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="Assignment description"
                          rows="3"
                          value={newAssignment.description}
                          onChange={e => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          value={newAssignment.category}
                          onChange={e => setNewAssignment(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="assignment">Assignment</option>
                          <option value="project">Project</option>
                          <option value="milestone">Milestone</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="100"
                          value={newAssignment.maxScore}
                          onChange={e => setNewAssignment(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="rounded-lg px-6 py-3 text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        Create Assignment
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAssignmentForm(false)}
                        className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4 mt-6">
                {assignments.map(assignment => (
                  <div key={assignment._id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{assignment.title}</h3>
                        <p className="text-gray-600 mt-2">{assignment.description}</p>
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                          <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>📊 Max Score: {assignment.maxScore}</span>
                          <span>📂 {assignment.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${new Date(assignment.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {new Date(assignment.dueDate) < new Date() ? 'Overdue' : 'Active'}
                        </span>
                        <button
                          onClick={() => viewSubmissions(assignment)}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:scale-105"
                        >
                          📋 View Submissions
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {assignments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Assignments</h3>
                    <p className="text-gray-600">Create your first assignment to get started</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'students' && (
          <section className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Assigned Students</h2>
                <p className="text-gray-600 text-sm">Manage your assigned students and their information</p>
              </div>
              <div className="grid gap-4">
                {students.map(s => (
                  <div
                    key={s._id}
                    className="border border-gray-200 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {s.studentId?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{s.studentId?.name}</div>
                          <div className="text-gray-600 text-sm">{s.studentId?.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Department</div>
                        <div className="font-medium text-gray-800">{s.studentId?.department}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Students Assigned</h3>
                    <p className="text-gray-600">Students will appear here once they are assigned to you</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignmentForSubs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-8 my-8 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedAssignmentForSubs.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Assignment Submissions</p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submissionStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{submissionStats.total}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Submissions</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{submissionStats.graded}</div>
                  <div className="text-xs text-gray-600 mt-1">Graded</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{submissionStats.pending}</div>
                  <div className="text-xs text-gray-600 mt-1">Pending</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{submissionStats.late}</div>
                  <div className="text-xs text-gray-600 mt-1">Late</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{submissionStats.averageScore.toFixed(1)}</div>
                  <div className="text-xs text-gray-600 mt-1">Avg Score</div>
                </div>
              </div>
            )}

            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700">Student</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Submitted</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Score</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {submissions.map(sub => (
                    <tr key={sub._id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        <div>{sub.studentId?.name}</div>
                        <div className="text-xs text-gray-500">{sub.studentId?.email}</div>
                      </td>
                      <td className="p-4">
                        <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${sub.status === 'graded' ? 'bg-green-100 text-green-700' :
                          sub.isLate ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {sub.status === 'graded' ? 'Graded' : sub.isLate ? 'Late' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        {sub.score !== undefined && sub.score !== null ? (
                          <span className="font-semibold text-blue-600">{sub.score}/{sub.maxScore}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline font-medium text-sm"
                          >
                            📄 View
                          </a>
                          <button
                            onClick={() => openGradingModal(sub)}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium hover:shadow-lg transition-all"
                          >
                            {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {submissions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-600">Students haven't submitted this assignment yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Grade Submission</h3>
              <button
                onClick={() => setShowGradingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="font-semibold text-gray-800 mb-1">{selectedSubmission.studentId?.name}</div>
              <div className="text-sm text-gray-600">{selectedSubmission.studentId?.email}</div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>📅 Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                {selectedSubmission.isLate && <span className="text-orange-600 font-medium">⚠ Late Submission</span>}
              </div>
              <a
                href={selectedSubmission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 underline font-medium"
              >
                📄 View Submission File
              </a>
            </div>

            <form onSubmit={gradeSubmission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score * (Max: {selectedSubmission.maxScore})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.maxScore}
                  value={gradeData.score}
                  onChange={(e) => setGradeData(prev => ({ ...prev, score: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter score"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  rows="4"
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
