import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { JSX } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Trades from "./pages/Trades";
import Journal from "./pages/Journal";
import Notebook from "./pages/Notebook";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function Protected({ children }: { children: JSX.Element }) {
    return (
        <ProtectedRoute>
            <Layout>{children}</Layout>
        </ProtectedRoute>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login"     element={<Login />} />
                <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                <Route path="/calendar"  element={<Protected><Calendar /></Protected>} />
                <Route path="/reports"   element={<Protected><Reports /></Protected>} />
                <Route path="/trades"    element={<Protected><Trades /></Protected>} />
                <Route path="/journal"   element={<Protected><Journal /></Protected>} />
                <Route path="/notebook"  element={<Protected><Notebook /></Protected>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
