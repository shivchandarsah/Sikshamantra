# Siksha Mantra - Online Learning Platform

A comprehensive online learning platform that connects students with teachers for personalized education experiences with AI-powered features, real-time communication, and secure payment processing.

## 🌟 Key Features

### For Students
- **Profile Management** - Complete profile with photo, qualifications, and contact details
- **Request Tutoring** - Post learning requests for specific subjects
- **Browse Teachers** - View and connect with qualified teachers with ratings
- **Real-time Chat** - End-to-end encrypted communication with teachers
- **Video Meetings** - Attend online classes with Jitsi Meet integration
- **Speech Transcription** - Automatic conversation recording for AI summaries
- **Meeting Notes** - Take notes during meetings for better learning
- **AI Meeting Summaries** - Receive detailed summaries via email after each class
- **Payment System** - Direct eSewa payment to teachers after meetings
- **Payment History** - Track all transactions and download receipts
- **Review System** - Rate teachers with 5-star ratings
- **Meeting Reminders** - Get notified about upcoming classes

### For Teachers
- **Professional Profiles** - Showcase qualifications and expertise with ratings
- **Browse Requests** - Find students seeking help in your subjects
- **Make Offers** - Propose tutoring services to students
- **Student Management** - Track and communicate with your students
- **Digital Whiteboard** - Interactive teaching tools during video calls (teacher-only)
- **Screen Sharing** - Share your screen during meetings (teacher-only)
- **Payment Settings** - Configure eSewa ID and QR code for receiving payments
- **Earnings Dashboard** - Track income with 80/20 revenue split
- **Payment Confirmation** - Verify student payments before earnings are credited
- **Payout Requests** - Withdraw available balance
- **Review Management** - View and respond to student ratings
- **AI Meeting Summaries** - Automatic class summaries sent to email

### Admin Features
- **User Management** - Manage students and teachers
- **Analytics Dashboard** - Platform statistics and insights
- **Meeting Oversight** - Monitor all meetings (encrypted chats protected)
- **Payment Monitoring** - Track platform revenue (20% commission)
- **Offer Management** - Oversee tutoring offers

### Core Features
- **Secure Authentication** - Email verification with JWT tokens (15min access, 7-day refresh)
- **Role-based Access** - Separate interfaces for students, teachers, and admin
- **Real-time Notifications** - Meeting invites, payment alerts, and appointment reminders
- **End-to-End Encryption** - AES-256-GCM encryption for chat messages
- **AI Integration** - Google Gemini for meeting summaries and chatbot
- **Payment Processing** - Direct eSewa integration with automatic commission split
- **Responsive Design** - Works seamlessly on all devices
- **Profile Pictures** - Personalized avatars throughout the platform

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful and accessible UI components
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications
- **Socket.io Client** - Real-time communication
- **Web Speech API** - Browser-based speech recognition
- **Web Crypto API** - Client-side encryption

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email sending functionality
- **Google Gemini AI** - AI-powered meeting summaries
- **CORS** - Cross-origin resource sharing

### Third-Party Integrations
- **Jitsi Meet** - Video conferencing platform
- **eSewa** - Payment gateway for Nepal
- **Google Gemini** - AI language model
- **Gmail SMTP** - Email delivery service

## 📁 Project Structure

```
Siksha Mantra/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   ├── Landingpage/ # Landing page components
│   │   │   ├── MeetingInterface.jsx # Video meeting with transcription
│   │   │   ├── DigitalWhiteboard.jsx # Interactive whiteboard
│   │   │   ├── DirectPaymentModal.jsx # eSewa payment
│   │   │   ├── MeetingReviewModal.jsx # 5-star rating system
│   │   │   ├── PaymentSetupBanner.jsx # Payment setup reminder
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── student/    # Student-specific pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── PaymentHistory.jsx
│   │   │   │   └── Reviews.jsx
│   │   │   ├── teacher/    # Teacher-specific pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Earnings.jsx
│   │   │   │   ├── PaymentSettings.jsx
│   │   │   │   └── Reviews.jsx
│   │   │   ├── admin/      # Admin pages
│   │   │   └── ...
│   │   ├── utils/          # Utility functions and services
│   │   │   ├── encryption.js # E2E encryption for chat
│   │   │   ├── services/   # API service layers
│   │   │   └── ...
│   │   └── App.jsx         # Main application component
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Node.js backend application
│   ├── controllers/        # Request handlers
│   │   ├── meeting.controller.js # Meeting & payment confirmation
│   │   ├── meetingReview.controller.js # Rating system
│   │   ├── meetingSummary.controller.js # AI summaries
│   │   ├── payment.controller.js # Payment processing
│   │   ├── teacherBalance.controller.js # Earnings management
│   │   ├── chat.controller.js # Encrypted chat
│   │   └── ...
│   ├── models/             # Database schemas
│   │   ├── meeting.model.js # Meeting with payment fields
│   │   ├── meetingSummary.model.js # AI-generated summaries
│   │   ├── meetingReview.model.js # Rating system
│   │   ├── payment.model.js # Payment records
│   │   ├── teacherBalance.model.js # Teacher earnings
│   │   ├── chat.model.js # Encrypted messages
│   │   └── ...
│   ├── services/           # Business logic services
│   │   ├── ai.service.js # Google Gemini integration
│   │   ├── meetingSummary.service.js # Summary generation
│   │   └── ...
│   ├── scripts/            # Utility scripts
│   │   ├── checkAISummaries.js # Verify AI summaries
│   │   ├── checkPaymentStatus.js # Debug payments
│   │   └── ...
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js           # Server entry point
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Git
- Gmail account (for email service)
- Google Gemini API key (for AI features)
- eSewa merchant account (for payments)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Siksha-Mantra
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# General
NODE_ENV=development
PORT=5005
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Tokens
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Siksha Mantra <your_email@gmail.com>"

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# eSewa Payment (Test Environment)
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SUCCESS_URL=http://localhost:5173/payment-success
ESEWA_FAILURE_URL=http://localhost:5173/payment-failure
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:5005/api/v1
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Create Admin User
```bash
cd backend
node scripts/createAdmin.js
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5005
- Admin Login: Use credentials from createAdmin script

## 🔑 Environment Variables Guide

### Required API Keys

#### Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

#### Gmail App Password
1. Enable 2-factor authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password
4. Add to `.env`: `EMAIL_PASS=your_app_password`

#### MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `.env`: `MONGODB_URI=your_connection_string`

## 🎯 Key Features Implementation

### 1. AI Meeting Summaries
- **Automatic Transcription**: Web Speech API captures conversation in real-time
- **Manual Notes**: Teachers and students can add notes during meetings
- **AI Processing**: Google Gemini generates comprehensive summaries
- **Email Delivery**: Summaries sent to all participants after meeting ends
- **Database Storage**: All summaries saved for future reference

**How it works:**
1. During meeting: Click "Record Speech" to start transcription
2. Optionally add manual notes in the Notes panel
3. End meeting: All content sent to AI
4. AI generates summary with key topics, important points, and action items
5. Summary emailed to teacher and student
6. Accessible via API: `GET /api/v1/meeting-summaries/my-summaries`

### 2. Payment System
- **Direct Payment**: Students pay directly to teacher's eSewa account
- **Revenue Split**: 80% to teacher, 20% platform commission
- **Payment Confirmation**: Teacher verifies payment before earnings credited
- **Payment History**: Complete transaction records for students
- **Earnings Dashboard**: Teachers track income and request payouts

**Payment Flow:**
1. Meeting completes
2. Student clicks "Pay NPR X"
3. Student sends money via eSewa to teacher
4. Student submits transaction ID
5. Teacher confirms payment
6. System automatically:
   - Creates payment record (status: success)
   - Credits teacher 80% to available balance
   - Records 20% platform commission
   - Sends confirmation notification to student

### 3. End-to-End Encryption
- **AES-256-GCM**: Military-grade encryption for chat messages
- **Client-side**: Encryption happens in browser before sending
- **Admin-proof**: Even admins cannot read encrypted messages
- **Deterministic Keys**: Generated from user IDs (no key exchange needed)

**How it works:**
1. User sends message
2. Browser encrypts with AES-256-GCM
3. Encrypted message sent to server
4. Server stores encrypted data (cannot decrypt)
5. Recipient's browser decrypts message
6. Admin sees: "🔒 [Encrypted Message]"

### 4. Review System
- **5-Star Rating**: Simple, intuitive rating system
- **Automatic Prompts**: Review modal appears after meeting ends
- **Profile Integration**: Ratings displayed on user profiles
- **Statistics**: Average rating and total reviews calculated
- **Mutual Reviews**: Both teacher and student can rate each other

### 5. Meeting System
- **Jitsi Integration**: Professional video conferencing
- **Role-based Controls**:
  - Teachers: Full access (screen share, whiteboard, recording)
  - Students: Limited access (view, chat, raise hand)
- **Digital Whiteboard**: Interactive teaching tool (teacher-only)
- **Speech Transcription**: Automatic conversation recording
- **Meeting Notes**: Manual note-taking during sessions

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login (returns tokens + user data)
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh access token
- `GET /api/v1/users/me` - Get current user

### Meetings
- `POST /api/v1/meetings/generate` - Create meeting link
- `GET /api/v1/meetings/upcoming` - Get upcoming meetings
- `GET /api/v1/meetings/past` - Get past meetings
- `PATCH /api/v1/meetings/status/:id` - Update meeting status (with meetingData)
- `POST /api/v1/meetings/confirm-payment/:id` - Confirm payment (teacher only)

### AI Summaries
- `GET /api/v1/meeting-summaries/my-summaries` - Get user's summaries
- `GET /api/v1/meeting-summaries/:id` - Get single summary
- `POST /api/v1/meeting-summaries/:id/resend-email` - Resend summary email

### Reviews
- `POST /api/v1/meeting-reviews` - Create review
- `GET /api/v1/meeting-reviews/user/:userId` - Get user's reviews
- `GET /api/v1/meeting-reviews/meeting/:meetingId` - Get meeting reviews

### Payments
- `GET /api/v1/payments/my-payments` - Get user's payment history
- `GET /api/v1/payments/:id` - Get payment details

### Teacher Balance
- `GET /api/v1/teacher-balance` - Get teacher's balance
- `GET /api/v1/teacher-balance/earnings` - Get earnings history
- `POST /api/v1/teacher-balance/payout-request` - Request payout

### Chat (Encrypted)
- `POST /api/v1/chats/create/:receiverId` - Send encrypted message
- `GET /api/v1/chats/get-all-chats/:offerId` - Get chat history (encrypted)

## 🔧 Utility Scripts

### Check AI Summaries
```bash
cd backend
node scripts/checkAISummaries.js
```
Shows total summaries, recent summaries, and email status.

### Check Completed Meetings
```bash
node scripts/checkCompletedMeetings.js
```
Lists all completed meetings and their details.

### Check Payment Status
```bash
node scripts/checkPaymentStatus.js
```
Debug payment records and statuses.

### Create Admin User
```bash
node scripts/createAdmin.js
```
Creates an admin account for platform management.

## 🚀 Deployment

### Production Checklist
- ✅ All build errors resolved
- ✅ Environment variables configured
- ✅ Database connection established
- ✅ Email service configured
- ✅ AI service configured
- ✅ Payment gateway configured
- ✅ SSL certificates installed
- ✅ CORS configured for production domain

### Backend Deployment (Railway/Render/Heroku)
1. Set environment variables in platform dashboard
2. Update `CLIENT_URL` to production frontend URL
3. Update `ESEWA_SUCCESS_URL` and `ESEWA_FAILURE_URL`
4. Deploy from GitHub repository
5. Verify all services are running

### Frontend Deployment (Vercel/Netlify)
1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist` folder
4. Configure redirects for SPA routing

## 🐛 Troubleshooting

### AI Summaries Not Generated
**Problem**: Meetings complete but no summaries in database

**Solutions**:
1. Check if meetingData is being sent when ending meeting
2. Verify Google Gemini API key is valid
3. Check backend logs for AI service errors
4. Run: `node scripts/checkAISummaries.js`

### Speech Transcription Not Working
**Problem**: "Record Speech" button doesn't work

**Solutions**:
1. Use Chrome or Edge browser (Web Speech API required)
2. Allow microphone permissions
3. Check browser console for errors
4. Fallback: Use manual notes instead

### Payment Not Showing
**Problem**: Payment shows as "pending" or NPR 0

**Solutions**:
1. Teacher must click "Confirm Payment" button
2. Check payment status: `node scripts/checkPaymentStatus.js`
3. Verify eSewa transaction ID is correct
4. Payment only counts after teacher confirmation

### Encrypted Messages Not Decrypting
**Problem**: Messages show as "🔒 [Encrypted Message]"

**Solutions**:
1. Ensure both users are logged in
2. Check browser console for decryption errors
3. Clear browser cache and reload
4. Verify user IDs are correct

### Meeting Not Starting
**Problem**: Jitsi meeting doesn't load

**Solutions**:
1. Check internet connection
2. Allow camera/microphone permissions
3. Try different browser
4. Check if Jitsi Meet is accessible: https://meet.jit.si

## 📊 Database Collections

### Users
- Stores user accounts (students, teachers, admin)
- Fields: email, password, role, profile data, ratings, payment settings

### Meetings
- Stores meeting records
- Fields: roomId, participants, status, price, payment status, duration

### MeetingSummaries
- Stores AI-generated summaries
- Fields: meeting, teacher, students, transcript, AI summary, email status

### MeetingReviews
- Stores ratings and reviews
- Fields: meeting, reviewer, reviewee, rating (1-5), comment

### Payments
- Stores payment transactions
- Fields: user, amount, purpose, status, eSewa reference

### TeacherBalances
- Stores teacher earnings
- Fields: teacher, total earnings, available balance, withdrawn amount

### Chats
- Stores encrypted messages
- Fields: sender, receiver, message (encrypted), isEncrypted flag

## 🔐 Security Features

1. **JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
2. **Password Hashing**: Bcrypt with salt rounds
3. **Email Verification**: Required before login
4. **End-to-End Encryption**: AES-256-GCM for chat messages
5. **Role-based Access**: Separate permissions for students/teachers/admin
6. **CORS Protection**: Configured for specific origins
7. **Input Validation**: Server-side validation for all inputs
8. **SQL Injection Prevention**: Mongoose parameterized queries
9. **XSS Protection**: React's built-in escaping
10. **HTTPS**: Required for production deployment

## 📈 Platform Statistics

### Revenue Model
- **Teacher Share**: 80% of payment
- **Platform Commission**: 20% of payment
- **Example**: NPR 1000 payment → Teacher gets NPR 800, Platform gets NPR 200

### User Roles
- **Students**: Request tutoring, attend meetings, make payments, rate teachers
- **Teachers**: Offer services, conduct meetings, receive payments, rate students
- **Admin**: Manage users, monitor platform, view analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Prince Sah** - Full Stack Developer
- **Shiv Chandar** - Project Mentor

## 🙏 Acknowledgments

- React and Node.js communities
- Google Gemini AI team
- Jitsi Meet for video conferencing
- eSewa for payment processing
- MongoDB for database solutions
- Tailwind CSS for styling framework

## 📞 Support

For issues and questions:
- Email: sahshivchandar14@gmail.com
- Create an issue on GitHub
- Check documentation files in the repository

---

**Built with ❤️ for education in Nepal**
