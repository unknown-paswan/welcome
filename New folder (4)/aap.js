const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/camera.html');
});

app.get('/display', (req, res) => {
  res.sendFile(__dirname + '/public/display.html');
});

io.on('connection', (socket) => {
  socket.on('stream', (image) => {
    // Broadcast the received camera image to all connected clients
    io.emit('stream', image);
  });
});

app.post('/upload', upload.single('video'), (req, res) => {
  // Store the video file path for later sending via email
  const videoPath = req.file.path;

  // Schedule sending the video via email after 5 minutes
  setTimeout(() => {
    sendVideoByEmail(videoPath);
  }, 5 * 60 * 1000);

  res.sendStatus(200);
});

async function sendVideoByEmail(videoPath) {
  try {
    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'YourEmailService', // E.g., Gmail, SendGrid, etc.
      auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password'
      }
    });

    // Define email options
    const mailOptions = {
      from: '',
      to: 'recipient@example.com',
      subject: 'Recorded Video',
      text: 'Please find the recorded video attached.',
      attachments: [{ filename: 'recorded_video.webm', path: videoPath }]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Delete the video file after sending the email
    fs.unlink(videoPath, (err) => {
      if (err) {
        console.error('Error deleting the video file:', err);
      }
    });

    console.log('Video sent via email successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
