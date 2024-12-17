import React, { createContext, useState } from 'react';

export const TaskRefreshContext = createContext({
  refreshTasks: false,
  setRefreshTasks: (value: boolean) => {},
});

export const TaskRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTasks, setRefreshTasks] = useState(false);

  return (
    <TaskRefreshContext.Provider value={{ refreshTasks, setRefreshTasks }}>
      {children}
    </TaskRefreshContext.Provider>
  );
};
