import { useState } from "react";
import { useMessage } from "../../components/Messages";
import { config } from "../../config";

const UserManagementPage = () => {
  const [userType, setUserType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<"create" | "update">("create");

  const { showMessage } = useMessage();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!username || !password || !userId) {
    showMessage({ type: "cancel", text: "All fields are required." });
    return;
  }

  try {
    if (mode === "create") {
      const response = await fetch(`${config.apiUrl}/users/add-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
          email: userEmail, //temp
          role: userType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showMessage({ type: "cancel", text: error.message || "Failed to create user." });
        return;
      }

      showMessage({ type: "success", text: "User created successfully." });
    } else {
      // Update user password logic here
      showMessage({ type: "success", text: "User password updated successfully." });
    }
  } catch (error) {
    showMessage({ type: "cancel", text: "An error occurred while submitting the form." });
    console.error(error);
  }

  console.log({ mode, userType, username, password, userId });
};
  return (
    <div className="user-management-container">
      <h1 className="user-management-title">User Management</h1>
      <div className="user-management-mode-buttons">
        <button
          type="button"
          className={`user-management-mode-button ${mode === "create" ? "active" : ""}`}
          onClick={() => setMode("create")}
        >
          Create User
        </button>
        <button
          type="button"
          className={`user-management-mode-button ${mode === "update" ? "active" : ""}`}
          onClick={() => setMode("update")}
        >
          Update Password
        </button>
      </div>

      <form className="user-management-form" onSubmit={handleSubmit}>
        <label className="user-management-label">
          User Type
            <select
                className={`user-management-select ${mode === "update" ? "user-management-disabled" : ""}`}
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                disabled={mode === "update"}
                >
                <option value="admin">Institution Representative</option>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
            </select>
        </label>

        <label className="user-management-label">
          User ID
          <input
            type="text"
            className="user-management-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>

        <label className="user-management-label">
          Email
          <input
            type="email"
            className="user-management-input"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            />
        </label>
        
        <label className="user-management-label">
          Username
            <input
                type="text"
                className={`user-management-input ${mode === "update" ? "user-management-disabled" : ""}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={mode === "update"}
            />
        </label>

        <label className="user-management-label">
          Password
          <input
            type="password"
            className="user-management-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="user-management-button">Submit</button>
      </form>
    </div>
  );
};

export default UserManagementPage;