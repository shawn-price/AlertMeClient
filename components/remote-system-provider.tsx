"use client";

import { useEffect, useRef } from "react";
import { remoteSystem } from "@/lib/remote-system";
import { dataStore } from "@/lib/data-store";
import { AlertToastProvider } from "./alert-toast-provider";

interface RemoteSystemProviderProps {
  children: React.ReactNode;
}

export default function RemoteSystemProvider({ children }: RemoteSystemProviderProps) {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return;
    isInitialized.current = true;

    // 1. Request Location Permission on app mount
    const requestLocationPermission = () => {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`📍 Location granted: ${latitude}, ${longitude}`);
            
            // Add coordinates to userData in DataStore
            const userData = dataStore.getUserData();
            const updatedUserData: Partial<any> = {
              ...userData,
              latitude,
              longitude,
            };
            dataStore.updateUserData(updatedUserData);
            
            console.log("[RemoteSystemProvider] Location stored in DataStore for heatmap tracking");
          },
          (error) => {
            console.warn("[RemoteSystemProvider] Location permission denied or error:", error.message);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes cache
          }
        );
      }
    };

    requestLocationPermission();

    // 2. Initialize Connection when user has an account
    const userData = dataStore.getUserData();
    
    if (userData?.accountNumber) {
      console.log("Initializing RemoteSystem for account:", userData.accountNumber);
      remoteSystem.init(userData.accountNumber);
    } else {
      console.log("No account number found, RemoteSystem not initialized");
    }

    // 3. Subscribe to local data changes to shadow them to the server
    const unsubscribe = dataStore.subscribe(() => {
      // Only push updates if connected
      if (remoteSystem.isConnected()) {
        remoteSystem.pushUpdate({
          userData: dataStore.getUserData(),
          loans: dataStore.getLoanApplications(),
          balance: dataStore.getUserData().balance
        });
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up RemoteSystem");
      unsubscribe();
      remoteSystem.disconnect();
    };
  }, []);

  return (
    <AlertToastProvider>
      {children}
    </AlertToastProvider>
  );
}
