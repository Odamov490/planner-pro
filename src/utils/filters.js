export const getIncomingTasks = (tasks, userId) => {
  return tasks.filter(t => t.assignedTo === userId);
};

export const getOutgoingTasks = (tasks, userId) => {
  return tasks.filter(t => t.userId === userId);
};