const { signToken } = require("../utils/jwt");

// Demo in-memory providers
const providers = [
  { id: 1, email: "doctor@example.com", password: "password123" },
  { id: 2, email: "nurse@example.com", password: "securepass" }
];

function login(email, password) {
  const provider = providers.find(p => p.email === email && p.password === password);
  if (!provider) return null;
  const token = signToken({ id: provider.id, email: provider.email });
  return { token, providerId: provider.id };
}

module.exports = { login, providers };
