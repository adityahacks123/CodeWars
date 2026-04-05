import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

import { SERVER_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SERVER_URL, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['polling'], // Use polling only to avoid websocket issues
            upgrade: false // Prevent upgrade to websocket
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
