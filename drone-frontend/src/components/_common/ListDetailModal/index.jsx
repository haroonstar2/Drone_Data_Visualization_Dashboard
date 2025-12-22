import { useState, useEffect } from "react";
import "../ModalShared.css";

function ListDetailModal({
    isOpen,
    onClose,
    title, // Title of the modal
    fetchList, // Function to get all objects 
    fetchDetails, // Function to get a specific instance of an object
    ListItemComponent,
    DetailsComponent,

    onItemSelect, // Function to run when an item is selected
    onActivate, // Function to run when activating a plan
    onCreateNew,  // Function to run when "Create New" is clicked

}) {
    // Variable to switch between list and view modes
    const [view, setView] = useState('list');
    // // Sets plans with a function to update plans
    const [list, setList] = useState([]);
    const [selected, setSelected] = useState(null);

    // When isOpen changes, run the following code
    useEffect(() => {
        if (isOpen) {
            // Default to list view
            setView('list');
            
            const loadList = async () => {
                const response = await fetchList();
                
                // If the status is success then update the plan list
                if (response.status === 'success') {
                    setList(response.data);
                }
            }
            loadList();
        }
    },[isOpen]);

    const handleSelect = async (item) => {
        const response = await fetchDetails(item.id);
        if (response.status === "success") {
            setSelected(response.data);
            setView("detail");
        }
        else {
            alert("Failed to load plan details.");
        }
    }

    const handleCreateNew = () => {
        if (onCreateNew) onCreateNew();
        onClose();
    };

    const handleConfirmSelection = () => {
        if (onItemSelect && selected) {
            onItemSelect(selected);
            onClose();
        }
    };

    // If the window isn't open then don't display anything 
    if(!isOpen) {
        return null;
    }

    return (
        <div className="plan-overlay" onClick={onClose}>
            <div className="plan-modal" onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>

                {view === 'list' && (
                    <div className="list-content">
                        {list.map(item => (
                            <div key={item.id} className="plan-item">
                                <ListItemComponent item={item} onClick={() => handleSelect(item)} />
                            </div>
                        ))}

                        {onCreateNew && (
                            <button className="btn btn-cancel" onClick={handleCreateNew} style={{width: "100%"}}>
                            Create New Plan
                            </button>
                        )} 
                    </div>
                )}

                {view === 'detail' && (
                    <div className="details">
                        <button onClick={() => setView('list')} className="btn btn-cancel" style={{ width: '100%' }}>Back to list</button>
                        <DetailsComponent 
                            details={selected} 
                            onClose={onClose}
                            onConfirm={handleConfirmSelection}
                            onActivate={onActivate}
                        />
                    </div>
                )}

                <div className="plan-actions">
                    <button onClick={onClose} className="btn btn-cancel" style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ListDetailModal;