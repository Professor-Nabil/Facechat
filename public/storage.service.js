const tokenKey = "token";

function saveAccessToken(token) {
  localStorage.setItem(tokenKey, token);
}

function readAccessToken() {
  return localStorage.getItem(tokenKey);
}

function deleteAccessToken() {
  localStorage.removeItem(tokenKey);
}

async function login() {
  const res = await fetch("/api/login", { method: "POST" });

  return await res.json();
}

async function getOneUser() {
  const res = await fetch("/api/getOneUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        token: readAccessToken(),
      },
    }),
  });

  return await res.json();
}

async function getAllUsers() {
  const res = await fetch("/api/getAllUsers");
  return await res.json();
}

async function getAllGlobalChat() {
  const res = await fetch("/api/getAllglobalChat");
  return await res.json();
}

async function addOneGlobalChat(userMessage) {
  const res = await fetch("/api/addOneGlobalChat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        token: readAccessToken(),
        userMessage,
      },
    }),
  });

  return await res.json();
}
