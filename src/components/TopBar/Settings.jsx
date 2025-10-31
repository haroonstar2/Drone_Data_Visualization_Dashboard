import './Settings.css';
import { useState, useEffect } from "react";
import { useDroneStore } from "../../store";
import { saveSettings } from "../../services/MockAPI";

// Function to handle settings window/funcitonality
//isOpen handles when user is changing settings
//onClose handles when user closed the window
function Settings({isOpen, onClose}) {

    // Get the current global settings. This holds both system and drone settings
    const globalSettings = useDroneStore((state) => state.settings);
    // Function to update the Zustrand store with new settings
    const updateSettings = useDroneStore((state) => state.updateSettings);
    // Gets local settings with a function to update the local settings    
    const [localSettings, setLocalSettings] = useState(globalSettings);

    // When the settings window opens or global settings change then update 
    // local settings
    useEffect(() => {
        if(isOpen) {
            setLocalSettings(globalSettings);
        }
    }, [isOpen, globalSettings]);

    // Handles changes in the form input
    const handleChange = (e) => {
        // Extract arguments from e
        const {name, value, type, checked} = e.target;
        // Categoroy is either system or drone. This decides what command to send to backend
        const [category, settingsName] = name.split(".");

        // Keep the previous settings and add anything new to it
        setLocalSettings((prev) => ({
            ...prev,
            // Category to update (system/drone)
            [category] : {
                ...prev[category], // Copy existing settings within the category
                // Update the single setting within that category
                [settingsName]: type === "checkbox" ? checked : value
            }
        }));

    };

    const handleSave = async () => {
        
        try {
            // Save the local settings to the mock backend and wait for a response
            const response = await saveSettings(localSettings);   
            // See if the response was correctly sent
            if (response.status === "success") {
                // Update the Zustrand store
                updateSettings(localSettings);
                console.log("Settings Saved!");
                onClose(); // Close the window
            }
            else {
                console.log("Failed to send settings" + response.message);
                alert("Failed to save settings:" + response.message);
            }
        } catch (error) {
            console.log("Save Settings Error:" + error);
            alert("An error has occurred while saving settings");
        }
    };

    // If the window isn't open then don't display anything
    if(!isOpen) {
        return null
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>

                <h2>Settings</h2>

                <div className="settings-form">
                    {/* System Settings */}
                    <fieldset>
                        <legend>System</legend>
                        <label>
                            Units:
                            <select 
                                name="system.units"
                                value={localSettings.system.units}
                                onChange={handleChange}
                                >
                                <option value="metric">Metric (m, m/s)</option>
                                <option value="imperial">Imperial (ft, ft/s)</option>
                            </select>
                        </label>
                    </fieldset>

                    {/* Drone Settings */}
                    <fieldset>
                        <legend>Drone</legend>
                        <label>
                            Return-to-Home Altitude (m):
                            <input 
                                type="number"
                                name="drone.rthAltitude"
                                value={localSettings.drone.rthAltitude}
                                onChange={handleChange}    
                            />
                        </label>
                    </fieldset>
                </div>




                <div className="settings-action">
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                    <button onClick={handleSave} className="btn-save">Save</button>
                </div>


            </div>
        </div>
    );
}
export default Settings;