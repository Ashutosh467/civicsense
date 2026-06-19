export const API = import.meta.env.VITE_API_URL || "http://localhost:10000";

// Returns the Authorization header for whichever account is logged in
// (admin or officer), or an empty object if neither token exists.
// Spread this into any fetch() call's headers, e.g.:
//   fetch(url, { headers: { ...authHeaders() } })
export const authHeaders = () => {
  const adminToken = localStorage.getItem("civicsense_token");
  const officerToken = localStorage.getItem("officerToken");
  const token = adminToken || officerToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
