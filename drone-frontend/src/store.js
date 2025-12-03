import {create} from 'zustand';
import { WAYPOINT_ACTIONS } from './components/waypointActions';

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
        drone: {
            rthAltitude: 100, 
            geofenceEnabled: true,
            homeLatitude: 36.737797,
            homeLongitude: -119.787125
        }
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
        activeWaypoints: [...state.activeWaypoints, {
            ...waypoint,
            // Default to PASS_THROUGH if no action specified
            action: waypoint.action || WAYPOINT_ACTIONS.PASS_THROUGH 
        }]
    })),

    // Finds a waypoint by ID and merges the 'updates' object into it
    updateWaypoint: (waypointId, updates) => set((state) => ({
        activeWaypoints: state.activeWaypoints.map((wp) => 
        wp.id === waypointId 
            ? { ...wp, ...updates } // Found it: create copy with updates merged
            : wp                    // Not it: return unchanged
        )
    })),

    removeWaypoint: (waypointId) => set((state) => ({
        activeWaypoints: state.activeWaypoints.filter(wp => wp.id !== waypointId)
    })),
  
    setWaypoints : (waypoints) => set({activeWaypoints: waypoints}),

    clearWaypoints: () => set({ activeWaypoints: [] }),

}));