"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface StaffStationContextType {
  station: string;
  setStation: (station: string) => void;
  matchesStation: (targetSubCity?: string | null) => boolean;
}

const StaffStationContext = createContext<StaffStationContextType>({
  station: "ALL",
  setStation: () => {},
  matchesStation: () => true,
});

export const STAFF_STATION_STORAGE_KEY = "liyuid_staff_active_station";

export function isCampusStation(loc?: string | null): boolean {
  if (!loc) return false;
  const l = loc.toLowerCase().trim();
  return (
    l.includes("campus") ||
    l.includes("aau") ||
    l.includes("aait") ||
    l.includes("kilo") ||
    l.includes("fbe") ||
    l.includes("kennedy") ||
    l.includes("university") ||
    l.includes("college")
  );
}

export function StaffStationProvider({ children }: { children: React.ReactNode }) {
  const [station, setStationState] = useState<string>("ALL");

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STAFF_STATION_STORAGE_KEY);
        if (saved) {
          setStationState(saved);
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  const setStation = (newStation: string) => {
    setStationState(newStation);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STAFF_STATION_STORAGE_KEY, newStation);
      }
    } catch {
      // safe fallback
    }
  };

  const matchesStation = (targetSubCity?: string | null): boolean => {
    if (!station || station === "ALL") return true;
    if (!targetSubCity) return true;
    const cleanTarget = targetSubCity.toLowerCase().trim();
    const cleanStation = station.toLowerCase().trim();

    if (station === "ALL_SUBCITIES") {
      return !isCampusStation(targetSubCity);
    }

    if (station === "ALL_CAMPUSES") {
      return isCampusStation(targetSubCity);
    }

    return cleanTarget.includes(cleanStation) || cleanStation.includes(cleanTarget);
  };

  return (
    <StaffStationContext.Provider value={{ station, setStation, matchesStation }}>
      {children}
    </StaffStationContext.Provider>
  );
}

export function useStaffStation() {
  return useContext(StaffStationContext);
}

