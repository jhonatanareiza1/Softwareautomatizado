import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';

import Dashboard from '../pages/Dashboard/Dashboard';

import StudentDashboard from '../pages/Student/StudentDashboard';
import ParentDashboard from '../pages/Parent/ParentDashboard';
import TeacherDashboard from '../pages/Teacher/TeacherDashboard';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={['student']}
                            />
                        }
                    >
                        <Route
                            path="/student"
                            element={<StudentDashboard />}
                        />
                    </Route>

                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={['parent']}
                            />
                        }
                    >
                        <Route
                            path="/parent"
                            element={<ParentDashboard />}
                        />
                    </Route>

                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={['teacher']}
                            />
                        }
                    >
                        <Route
                            path="/teacher"
                            element={<TeacherDashboard />}
                        />
                    </Route>
                </Route>

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;