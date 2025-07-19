const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for rooms (ในการใช้งานจริงควรใช้ database)
let rooms = {};

// Routes
// สร้างห้องใหม่
app.post('/api/rooms', (req, res) => {
  const { roomName, moderatorName } = req.body;
  
  if (!roomName || !moderatorName) {
    return res.status(400).json({ 
      error: 'Room name and moderator name are required' 
    });
  }
  
  const roomId = uuidv4();
  const room = {
    id: roomId,
    name: roomName,
    moderator: moderatorName,
    participants: [],
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  rooms[roomId] = room;
  
  res.json({
    success: true,
    room: room,
    joinUrl: `http://https://front-end-e9xy.onrender.com/room/${roomId}`
  });
});

// ดูข้อมูลห้อง
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ room });
});

// เข้าร่วมห้อง
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { participantName } = req.body;
  
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (!room.isActive) {
    return res.status(400).json({ error: 'Room is not active' });
  }
  
  // เพิ่มผู้เข้าร่วม
  const participant = {
    id: uuidv4(),
    name: participantName,
    joinedAt: new Date().toISOString()
  };
  
  room.participants.push(participant);
  
  res.json({
    success: true,
    participant,
    room: {
      id: room.id,
      name: room.name,
      moderator: room.moderator
    }
  });
});

// ดูรายการห้องทั้งหมด
app.get('/api/rooms', (req, res) => {
  const activeRooms = Object.values(rooms)
    .filter(room => room.isActive)
    .map(room => ({
      id: room.id,
      name: room.name,
      moderator: room.moderator,
      participantCount: room.participants.length,
      createdAt: room.createdAt
    }));
  
  res.json({ rooms: activeRooms });
});

// ปิดห้อง
app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  room.isActive = false;
  
  res.json({ success: true, message: 'Room closed successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: Object.keys(rooms).length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API endpoints:`);
  console.log(`   POST /api/rooms - Create room`);
  console.log(`   GET /api/rooms - List rooms`);
  console.log(`   GET /api/rooms/:id - Get room info`);
  console.log(`   POST /api/rooms/:id/join - Join room`);
  console.log(`   DELETE /api/rooms/:id - Close room`);
});