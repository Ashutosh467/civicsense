import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../services/api";
import { ShieldCheck, Loader2, HardHat } from "lucide-react";
import toast from "react-hot-toast";

export default function OfficerSetup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing invite link.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/officer-invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");

      localStorage.setItem("officerToken", data.token);
      localStorage.setItem("officerInfo", JSON.stringify(data.officer));
      localStorage.setItem("officerId", data.officer.officerId);
      toast.success(`Welcome, ${data.officer.name}! Your account is ready.`);
      navigate(`/officer/${data.officer.officerId}`);
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
          to="/officer-login"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
        >
          Already have an account? Log in →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-yellow-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <ShieldCheck className="w-10 h-10 text-orange-400" />
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full">
            <HardHat className="w-3.5 h-3.5" />
            Officer Account Setup
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
          Set Up Your Account
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          You've been added as a field officer. Set your email and password to
          access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition placeholder:text-gray-600"
              placeholder="officer@civicsense.gov"
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
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Activate My Account"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-500 text-xs mb-1">
            Already activated your account?
          </p>
          <Link
            to="/officer-login"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
          >
            Go to Officer Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
