const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteFolderRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

try {
  deleteFolderRecursive('.next');
  console.log('Successfully deleted .next directory');
} catch (error) {
  console.error('Error deleting .next directory:', error.message);
}