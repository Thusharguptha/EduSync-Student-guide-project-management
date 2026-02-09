import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import TeacherChat from './pages/teacher/TeacherChat.jsx'
import StudentChat from './pages/student/StudentChat.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/chat"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/chat"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentChat />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
