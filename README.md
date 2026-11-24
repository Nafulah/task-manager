# Task Manager - MERN Stack

A full-stack Task Management application where users can register, login, and manage their daily tasks.

**Live Demo:** https://task-manager-nafulah.onrender.com
**Author:** Adelight Masibo (Nafulah)

---

### ✨ Features
- User Registration & Login with JWT Authentication
- Create, Edit, Delete Tasks
- Mark Tasks as Completed / Pending
- Secure API with protected routes
- Responsive UI

### 🛠️ Tech Stack
- **Frontend:** React.js (Vite), CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT, bcrypt
- **Deployment:** Render

### 📁 Project Structure
Task-Manager/
├── Backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── README.md

### 🚀 Local Installation

1. **Clone the repo**
```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager

2. **Setup Backend**
```bash
cd Backend
npm install

Create .env file in Backend:
CODE
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development

3. **Setup Frontend**
``` bash
cd ../Frontend
npm install
npm run dev

4. **Run Backend**
```bash
cd ../Backend
npm start

Deployment (Render)
Platform: Render.com
Root Directory: Backend
Build Command: npm install && cd ../Frontend && npm install && npm run build
Start Command: npm start
Environment Variables: MONGO_URI, JWT_SECRET, NODE_ENV=production

* Deployment is automatic - every git push to GitHub triggers a new deploy.

 Testing
Register new user
Login
Add / Edit / Delete task
Logout

 Future Improvements
Task due dates & reminders
Categories & filter
sDark mode
© 2026 Adelight Masibo - All Rights Reserved
