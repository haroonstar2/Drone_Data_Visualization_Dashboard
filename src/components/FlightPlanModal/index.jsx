import { useState, useEffect } from "react";
import { getPlanList, getPlanDetails } from "../../services/MockAPI";
import "./FlightPlanModal.css"


function FlightPlanModal({isOpen, onClose}) {
    // Variable to switch between list and view modes
    const [view, setView] = useState('list');
    // Sets plans with a function to update plans
    const [planList, setPlanList] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    // 

    // When isOpen changes, run the following code
    useEffect(() => {
        if(isOpen) {
            // Request data and wait for a response
            const loadPlans = async () => {
                const response = await getPlanList();
                // If the status is success then update the plan list
                if (response.status === 'success') {
                    setPlanList(response.data.plans);
                }
            }
            loadPlans();
        }
    },[isOpen]);

    // Set the view to detail and the selected plan to planId
    const handleSelect = async (planId) => {
        setView('detail');
        const response = await getPlanDetails(planId);
        if (response.status === 'success') {
            setSelectedPlan(response.data);
        }
    };

    // If the window isn't open then don't display anything 
    if(!isOpen) {
        return null;
    }

    return (
        <div className="plan-overlay" onClick={onClose}>
            <div className="plan-modal" onClick={e => e.stopPropagation()}>

                {view === 'list' && (
                    <div>
                        <h2>Flight Plans</h2>
                        {planList.map(plan => (
                            <div key={plan.id} onClick={() => handleSelect(plan.id)}>
                                <strong>{plan.name}</strong>
                                <small> {plan.waypointCount} waypoints</small>
                            </div>
                        ))}
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-cancel">Create New Plan</button>
                        </div>
                    </div>
                )}

                {view === 'detail' && selectedPlan && (
                    <div>
                        <button onClick={() => setView('list')} className="btn btn-cancel">Back to list</button>
                        <h2>{selectedPlan.name}</h2>
                        <p>{selectedPlan.description}</p>

                        <ul>
                            {selectedPlan.waypoints.map(wp => (
                                <li key={wp.order}>
                                    WP {wp.order}: ({wp.latitude}, {wp.longitude}) @ {wp.altitude}m - Action: {wp.action}
                                </li>
                            ))}
                        </ul>
                    </div>
                    )}

                    <div className="plan-actions">
                        {view === 'detail' && selectedPlan && (
                            <>
                                <button className="btn btn-save">Save Changes</button>
                                <button className="btn btn-save">Activate Plan</button>
                            </>
                        )}

                        <button onClick={onClose} className="btn btn-cancel">Close</button>
                    </div>

            </div>
        </div>
    );
};

export default FlightPlanModal;