module.exports = {
  readFileSync: function(path, options) {
    throw new Error('fs.readFileSync is not implemented in React Native');
  },
  existsSync: function(path) {
    // Return false since file system access is not supported
    return false;
  },
  statSync: function(path) {
    throw new Error('fs.statSync is not implemented in React Native');
  },
  accessSync: function(path, mode) {
    throw new Error('fs.accessSync is not implemented in React Native');
  }
};
