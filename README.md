# Email Gateway Monorepo
 
A full-stack email gateway solution with a modern dashboard and robust backend.
 
## Short Description
This project provides a unified platform for managing email integrations (Gmail, Outlook, etc.) for multiple clients. It features a React/Next.js-based admin dashboard and a scalable NestJS API backend.
 
## Tech Stack
- **Frontend:** Next.js, TailwindCSS
- **Backend:**  NestJS, TypeORM
- **Database:** PostgreSQL
- **Other:** Docker, Socket.IO, REST API
 
## Project Structure
```
Email_Gateway/
├── frontend/             # Next.js admin dashboard
└── nest-email-gateway/   # NestJS backend API
```
 
## Setup Instructions
 
### Backend (NestJS)
```bash
cd nest-email-gateway
npm install
npm run start:dev      
```
 
### Frontend (Next.js)
```bash
cd frontend
npm install  
npm run dev      
```
 
## Environment Variables
 
### Frontend(.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
 
### Backend(.env)
PORT=3000
PUBLIC_URL=http://localhost:3000    
FRONTEND_ORIGIN=http://localhost:3001
DATABASE_URL=postgres://postgres:your_db_password@localhost:5432/email_gateway
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d
REDIS_URL=redis://localhost:6379
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
MS_CLIENT_ID=your_ms_client_id
MS_CLIENT_SECRET=your_ms_client_secret
GMAIL_TOKEN_EXPIRY=2025-11-30T10:00:00Z
OUTLOOK_TOKEN_EXPIRY=2025-12-01T09:00:00Z
WEBHOOK_SECRET=your_webhook_secret
 
NGROK_AUTOSTART=true
NGROK_AUTHTOKEN=your-real-ngrok-token

 
## Usage / Run Commands
 
### Backend
- Development: `npm run start:dev`
- Production:  `npm run start:prod`
-
 
### Frontend
- Development: `npm run dev`
- Production:  `npm run build && npm start`
 
---