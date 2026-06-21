import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../services/api";
import { ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSetup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing invite link.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/admin-invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");

      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}! Your admin account is ready.`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex flex-col justify-center items-center p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Invalid Invite Link
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          This link is missing its invite token. Please check the link you
          received and try again.
        </p>
        <Link
          to="/login"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
        >
          Already have an account? Log in →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <ShieldCheck className="w-10 h-10 text-cyan-400" />
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
          Set Up Your Admin Account
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          You've been invited as an admin. Set your details below to get access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition placeholder:text-gray-600"
              placeholder="Your Full Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition placeholder:text-gray-600"
              placeholder="admin@civicsense.gov"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Create Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Activate My Account"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Already activated?{" "}
          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
