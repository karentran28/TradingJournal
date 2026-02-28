
import { Navigate } from "react-router-dom";
import { getToken } from "../auth/token";
import { JSX } from "react";

type Props = {
    children: JSX.Element;
}

export default function ProtectedRoute({children}: Props) {
    const token = getToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}