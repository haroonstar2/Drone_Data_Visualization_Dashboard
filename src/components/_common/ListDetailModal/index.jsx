import { useState, useEffect } from "react";
import "../ModalShared.css";

function ListDetailModal({
    isOpen,
    onClose,
    title, // Title of the modal
    fetchList, // Function to get all objects 
    fetchDetails, // Function to get a specific instance of an object
    ListItemComponent,
    DetailsComponent
}) {
    // Variable to switch between list and view modes
    const [view, setView] = useState('list');
    // Sets plans with a function to update plans
    const [list, setList] = useState([]);
    const [selected, setSelected] = useState(null);

    // When isOpen changes, run the following code
    useEffect(() => {
        if (isOpen) {
            const loadList = async () => {
                const response = await fetchList();
                // If the status is success then update the plan list
                if (response.status === 'success') {
                    setList(response.data.items);
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
    }

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
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-cancel">Create New</button>
                        </div>
                    </div>
                )}

                {view === 'detail' && (
                    <div className="details">
                        <button onClick={() => setView('list')} className="btn btn-cancel">Back to list</button>
                        <DetailsComponent details={selected} onClose={onClose}/>
                    </div>
                )}

                <div className="plan-actions">
                    <button onClick={onClose} className="btn btn-cancel">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ListDetailModal;