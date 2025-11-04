import {create} from 'zustand';

export const useDroneStore = create((set) => ({

    telemetry: {
        latitude: 0,
        longitude: 0,
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
        system: {units: "metric", mapDisplay: "satellite"},
        drone: {rthAltitude: 100, geofenceEnabled: true}
    },
    missionLogs: [],

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

    addMissionLog: (newMissionLog) => set((state) => ({
        missionLogs: [newMissionLog, ...state.missionLogs]
    })),

}));