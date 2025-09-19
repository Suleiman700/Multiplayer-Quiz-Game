'use client';

import React from 'react';
import { useSocket } from '@/lib/socket-client';

export const ConnectionStatus: React.FC = () => {
  const { connected, connecting } = useSocket();

  if (connecting) {
    return (
      <div className="connection-reconnecting">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="connection-disconnected">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-danger-600 rounded-full"></div>
          <span>Disconnected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="connection-connected">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-success-600 rounded-full"></div>
        <span>Connected</span>
      </div>
    </div>
  );
};
