import {create} from 'zustand';

export const useDroneStore = create((set) => ({
    telemetry: {
        latitude: 36.737797,
        longitude: -119.787125,
        altitude: 0,
        speed: 0,
        battery: 100,
        heading: 0,
    },
    droneStatus: {
        armed: false,
        mode: 'IDLE',
        health: 'UNKNOWN'
    },
    settings: {
        system: {units: "metric", mapDisplay: "satellite", storeLog: true},
        drone: {rthAltitude: 100, geofenceEnabled: true}
    },
    missionLogs: [],
    environment: {
        windSpeed: 2.5,
        windDirection: 180,
        temperature: 22.5,
    },
    appMode: 'idle',
    activeWaypoints: [],

    updateTelemetry: (newTelemetryData) => set((state) => ({
        telemetry: {
            ...state.telemetry,
            ...newTelemetryData
        }
    })),

    updateStatus: (newStatusData) => set((state) => ({
        droneStatus: {
            ...state.droneStatus,
            ...newStatusData
        }
    })),

    updateSettings: (newSettings) => set((state) => ({
        settings: {
            ...state.settings,
            ...newSettings
        }
    })),

    updateEnvironment: (newEnvData) => set((state) => ({
        environment: { ...state.environment, ...newEnvData }
    })),

    setAppMode: (newMode) => set({ 
        appMode: newMode 
    }),

    addMissionLog: (newMissionLog) => set((state) => ({
        missionLogs: [...state.missionLogs, newMissionLog]
    })),

    toggleStoreLogs: () => set((state) => ({
        settings: {
            ...state.settings,
            system: {
                ...state.settings.system,
                storeLog: !state.settings.system.storeLog
            }
        }
    })),

    addWaypoint: (waypoint) => set((state) => ({
        activeWaypoints: [...state.activeWaypoints, waypoint]
    })),

    removeWaypoint: (waypointId) => set((state) => ({
        activeWaypoints: state.activeWaypoints.filter(wp => wp.id !== waypointId)
  })),
  
    clearWaypoints: () => set({ activeWaypoints: [] }),

}));