# DEPLOYMENT DOCUMENTATION - TASK MANAGER

 1. Production Environment SetupCreated MongoDB Atlas cluster and whitelisted IP 0.0.0.0/0Created Environment Variables on Render:MONGO_URI = MongoDB connection stringJWT_SECRET = secret key for authenticationNODE_ENV = productionFixed API URL issue: Changed <http://localhost:5000/api/>... to /api/... in Register.jsx, Login.jsx, Dashboard.jsx so it works on live server.Fixed case sensitivity: Changed frontend to Frontend in server.js and package.json
 2. Deployment PlatformPlatform: Render.com (Web Service)Root Directory: BackendBuild Command: npm install && cd../Frontend && npm install && npm run build buildStart Command: npm startLive URL: <https://task-manager-nafulah.onrender.com>
 3. Deployment StepsPush code to GitHubConnect GitHub repo to RenderAdd Environment VariablesDeploy - Render builds frontend and serves it via backendTest live link - Register -> Login -> Create Task
 4. Final Testing ResultsSite loads - LiveUser can RegisterUser can LoginUser can Create, Edit, Delete TasksData saves in MongoDB Atlas[x]
 5. Maintenance & Future UpdatesTo update: Just push to GitHub git push, Render auto-redeploys in 2 minsTo check errors: Render Dashboard > LogsTo change DB: Update MONGO_URI in Render > EnvironmentBackup: MongoDB Atlas auto-backup enabled
