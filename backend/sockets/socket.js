let ioInstance = null;

// store io instance
export const setIO = (io) => {
  ioInstance = io;
};

// get io anywhere in project
export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};
