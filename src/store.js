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
    missionLogs: [],

    updateTelemetry: (newTelemetryData) => set({
        telemetry: newTelemetryData
    }),

    updateStatus: (newStatusData) => set({
        droneStatus: newStatusData
    }),

    addMissionLog: (newMissionLog) => set((state) => ({
        missionLogs: [newMissionLog, ...state.missionLogs]
    })),

}));