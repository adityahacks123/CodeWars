# 🚀 Quick Test Guide

## 3-Minute Test:

### 1. Start Backend (30 seconds)
```bash
npm start
```
Wait for: `🚀 CodeHub API Server Running`

### 2. Solve a Problem (1 minute)
- Open app
- Go to any problem
- Write correct solution
- Click "Submit"
- Wait for "All test cases passed!"

### 3. Check Results (1 minute)

**Backend Logs:**
Look for:
```
✅ Created new UserSolved record for problem: [Title]
💾 User saved to MongoDB. Stats: 1 solved
   Current stats in DB: totalProblemsSolved=1, easy=1
```

**Profile Page:**
- Go to `/profile`
- Should show: Problems Solved: 1, Easy: 1
- Recently Solved Problems: Shows the problem

**MongoDB:**
```javascript
// In MongoDB Compass, run in users collection:
db.users.findOne({_id: ObjectId("690b36536b9130bfd180602b")})
// Should show: totalProblemsSolved: 1, easySolved: 1

// In user-solved collection:
db["user-solved"].findOne({userId: ObjectId("690b36536b9130bfd180602b")})
// Should show: 1 entry with problem details
```

## Expected Results:

✅ Backend logs show stats saved
✅ MongoDB has updated stats
✅ MongoDB user-solved collection has entry
✅ Profile page shows updated numbers

## If Not Working:

1. **Backend logs show error?**
   - Check console for error message
   - Restart backend

2. **MongoDB shows 0?**
   - Check if User.save() is working
   - Check backend logs

3. **Profile shows 0?**
   - Click refresh button
   - Check browser console
   - Verify API response

## Key Files:

- Backend: `backend/models/User.js`, `backend/models/UserSolved.js`
- API: `backend/controllers/userController.js`
- Frontend: `frontend/src/components/Profile.jsx`

**That's it! Test and report what you see!** 🎉
