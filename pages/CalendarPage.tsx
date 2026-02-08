import React from 'react';
import { CalendarApp } from '../components/calendar/CalendarApp';

export const CalendarPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-80px)]">
      <CalendarApp />
    </div>
  );
};
