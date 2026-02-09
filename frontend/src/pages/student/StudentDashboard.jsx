import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function StudentDashboard() {
  const [project, setProject] = useState(null)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [activeTab, setActiveTab] = useState('project')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [milestoneFile, setMilestoneFile] = useState(null)
  const [uploadingMilestone, setUploadingMilestone] = useState(false)

  const fetchData = async () => {
    try {
      const [projectRes, progressRes, assignmentsRes, submissionsRes] = await Promise.all([
        api.get('/api/student/project'),
        api.get('/api/student/progress'),
        api.get('/api/student/assignments'),
        api.get('/api/student/submissions')
      ])

      const projectData = projectRes.data
      setProject(projectData)
      setTitle(projectData?.title || '')
      setAbstract(projectData?.abstract || '')
      setFileUrl(projectData?.fileUrl || '')
      setProgress(progressRes.data)
      setAssignments(assignmentsRes.data)
      setSubmissions(submissionsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const { data } = await api.post('/api/student/project', { title, abstract, fileUrl })
      setProject(data.project)
      if (data.titleClash) {
        setMessage('⚠️ Project submitted successfully! Warning: Similar title detected - please ensure your project is unique.')
      } else {
        setMessage('✅ Project submitted successfully!')
      }
      fetchData() 
    } catch (error) {
      console.error('Submission error:', error)
      setMessage('Error: ' + (error.response?.data?.message || error.message || 'Failed to submit project'))
    }
  }

  const updateProgress = async (milestoneIndex, progressValue, status, notes = '') => {
    try {
      await api.post('/api/student/progress', {
        milestoneIndex,
        progress: progressValue,
        status,
        notes
      })
      fetchData() // Refresh progress data
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/api/student/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFileUrl(data.url)
      setMessage('File uploaded')
    } catch (err) {
      setMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmitModal(true)
    setSubmissionFile(null)
    setSubmissionNotes('')
  }

  const onSubmissionFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubmissionFile(file)
  }

  const uploadMilestoneDocument = async (milestoneIndex) => {
    if (!milestoneFile) {
      alert('Please select a file first')
      return
    }

    setUploadingMilestone(true)
    try {
      const formData = new FormData()
      formData.append('file', milestoneFile)

      const { data } = await api.post('/api/student/upload', formData)

      await api.post('/api/student/progress', {
        milestoneIndex,
        fileUrl: data.url,
        progress: progress.milestones[milestoneIndex].progress,
        status: progress.milestones[milestoneIndex].status,
        notes: progress.milestones[milestoneIndex].notes
      })

      setMilestoneFile(null)
      fetchData()
      alert('Document uploaded! Waiting for teacher approval.')
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Error uploading document')
    } finally {
      setUploadingMilestone(false)
    }
  }

  const submitAssignment = async (e) => {
    e.preventDefault()
    if (!submissionFile) {
      setMessage('Please select a file to submit')
      return
    }

    setSubmitting(true)
    try {
      // Upload file first
      const form = new FormData()
      form.append('file', submissionFile)
      const { data: uploadData } = await api.post('/api/student/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Submit assignment
      await api.post('/api/student/assignment/submit', {
        assignmentId: selectedAssignment._id,
        fileUrl: uploadData.url,
        notes: submissionNotes
      })

      setMessage('Assignment submitted successfully!')
      setShowSubmitModal(false)
      fetchData() // Refresh data
    } catch (err) {
      setMessage('Submission failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(s => s.assignmentId?._id === assignmentId)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Student Dashboard</h1>
          <p className="text-white/80">Manage your projects and assignments</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
          {[
            { id: 'project', label: 'Project', icon: '📋' },
            { id: 'progress', label: 'My Progress', icon: '📊' },
            { id: 'assignments', label: 'Assignments', icon: '📝' }
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

        {activeTab === 'project' && (
          <form
            onSubmit={submit}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Proposal</h2>
              <p className="text-gray-600 text-sm">Submit your project details</p>
            </div>

            {message && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your project title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Abstract</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  rows="4"
                  placeholder="Describe your project in detail..."
                  value={abstract}
                  onChange={e => setAbstract(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Document (PDF)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={onFileChange}
                      className="hidden"
                    />
                    📎 Choose File
                  </label>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      Uploading...
                    </div>
                  )}
                </div>
                {fileUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm bg-green-50 border border-green-200 text-green-700">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>File uploaded successfully</span>
                    <a
                      className="ml-auto text-blue-600 hover:text-blue-700 underline"
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📄 View Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
              }}
            >
              Submit Project
            </button>
          </form>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 My Progress</h2>

            {/* Overall Progress Display */}
            {progress && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Overall Project Progress</h3>
                  <span className="text-3xl font-bold text-blue-600">{progress.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progress.overallProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {progress && progress.milestones && progress.milestones.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {progress.milestones?.map((milestone, index) => (
                    <div
                      key={index}
                      className={`border border-gray-200 rounded-xl p-4 transition-all duration-200 ${milestone.locked ? 'bg-gray-100 opacity-70' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800">{milestone.title}</h3>
                          {milestone.locked && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-gray-600 flex items-center gap-1">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                          milestone.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{milestone.description}</p>

                      {!milestone.locked && (
                        <div className="space-y-3">
                          {/* File Upload for Milestone */}
                          {!milestone.fileUrl && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <input
                                type="file"
                                onChange={(e) => setMilestoneFile(e.target.files[0])}
                                className="text-sm"
                              />
                              <button
                                onClick={() => uploadMilestoneDocument(index)}
                                disabled={uploadingMilestone}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                              >
                                {uploadingMilestone ? 'Uploading...' : '📤 Upload'}
                              </button>
                            </div>
                          )}

                          {/* Show uploaded document status */}
                          {milestone.fileUrl && (
                            <div className={`p-3 rounded-lg border ${milestone.approvedByTeacher
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                              }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">📄 Document uploaded</span>
                                  {milestone.approvedByTeacher ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      ✓ Approved by Teacher
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                      ⏳ Waiting for Approval
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={milestone.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                                >
                                  View Document
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <label className="text-sm font-medium text-gray-700 w-20">Status:</label>
                            <select
                              value={milestone.status}
                              onChange={(e) => updateProgress(index, milestone.progress, e.target.value)}
                              disabled={milestone.locked}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={milestone.notes || ''}
                              onChange={(e) => updateProgress(index, milestone.progress, milestone.status, e.target.value)}
                              disabled={milestone.locked}
                              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      )}

                      {milestone.locked && (
                        <div className="mt-3 p-3 bg-gray-200 rounded-lg text-sm text-gray-600 flex items-center gap-2">
                          <span>🔒</span>
                          <span>Complete the previous milestone to unlock this one</span>
                        </div>
                      )}

                      {milestone.completedAt && (
                        <div className="mt-3 text-xs text-green-600">
                          ✓ Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!progress && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Progress Tracking Yet</h3>
                <p className="text-gray-600">Submit your project proposal to start tracking progress</p>
              </div>
            )}

            {progress && (!progress.milestones || progress.milestones.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Milestones Coming Soon</h3>
                <p className="text-gray-600">Your milestones will appear after you submit your project</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Assignments</h2>
              <p className="text-gray-600 text-sm">View and manage your assignments</p>
            </div>

            <div className="space-y-4">
              {assignments.map(assignment => {
                const submission = getSubmissionForAssignment(assignment._id)
                const isOverdue = new Date(assignment.dueDate) < new Date()
                const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))

                return (
                  <div key={assignment._id} className="border border-gray-200 rounded-xl p-6 bg-gray-50 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800 text-lg">{assignment.title}</h3>
                          {submission && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${submission.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                              submission.isLate ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {submission.status === 'graded' ? '✓ Graded' : submission.isLate ? 'Submitted Late' : '✓ Submitted'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-2">{assignment.description}</p>
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                          <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>📊 Max Score: {assignment.maxScore}</span>
                          <span>📂 {assignment.category}</span>
                          <span>👨‍🏫 {assignment.teacherId?.name}</span>
                        </div>

                        {submission && submission.status === 'graded' && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Score:</span>
                              <span className="text-xl font-bold text-blue-600">{submission.score}/{submission.maxScore}</span>
                            </div>
                            {submission.feedback && (
                              <div className="mt-3">
                                <span className="text-sm font-medium text-gray-700 block mb-1">Teacher Feedback:</span>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded border border-blue-100">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                        {!isOverdue && daysLeft > 0 && (
                          <div className="text-xs text-gray-500">
                            {daysLeft} days left
                          </div>
                        )}
                        {!submission ? (
                          <button
                            onClick={() => handleSubmitAssignment(assignment)}
                            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:scale-105"
                          >
                            📤 Submit
                          </button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all duration-200 text-center"
                            >
                              📄 View Submission
                            </a>
                            <button
                              onClick={() => handleSubmitAssignment(assignment)}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 w-full"
                            >
                              🔄 Resubmit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {assignments.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Assignments</h3>
                  <p className="text-gray-600">No assignments have been created yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {project && activeTab === 'project' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Project Status</h3>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status: </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'approved' ? 'bg-green-100 text-green-700' :
                    project.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      project.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {project.status}
                  </span>
                </div>
                {project.grade && (
                  <div>
                    <span className="text-sm text-gray-600">Grade: </span>
                    <span className="font-semibold text-blue-600">{project.grade}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Submission Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Submit Assignment</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-800">{selectedAssignment.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedAssignment.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>📅 Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                <span>📊 Max: {selectedAssignment.maxScore} pts</span>
              </div>
            </div>

            <form onSubmit={submitAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-blue-50">
                    <input
                      type="file"
                      onChange={onSubmissionFileChange}
                      className="hidden"
                      required
                    />
                    {submissionFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{submissionFile.name}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📎</div>
                        <p className="text-gray-600">Click to choose a file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, ZIP</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                  rows="3"
                  placeholder="Add any notes or comments..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
