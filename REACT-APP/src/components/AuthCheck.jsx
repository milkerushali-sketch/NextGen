import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCheck({ children, label = "Login to continue" }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        {label}
      </button>
    );
  }

  return children;
}
