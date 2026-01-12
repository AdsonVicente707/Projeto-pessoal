const fs = require('fs');
const path = require('path');

const ensureUploadsDir = (req, res, next) => {
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  next();
};

module.exports = ensureUploadsDir;