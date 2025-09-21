// src/components/RequirmentsForm.tsx
import { useState } from "react";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    colourOptions,
    districts,
    projectSize,
    rooms,
    scopeOptions,
    specialNotes,
    startingTime,
} from "../data";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./pages.scss";

const RequirmentsForm = () => {
    const user = useUser();

    const [formData, setFormData] = useState({
        special_notes: [] as string[],
        color: [] as string[],
        scope: [] as string[],
        starting_time: "",
        phone_1: "",
        phone_2: "",
        message_number: "",
        district: "",
        location: "",
        // plot_size: "",
        project_size: [] as string[],
        rooms: [] as string[],
        budget: "",
    });

    // Track selected plot radio to allow unselect
    const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

    const handleSelectChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value.map((v: any) => v.value),
        }));
    };

    const handleInputChange = (key: string, value: string) => {
        // If message_number is manually edited, unselect phone pick
        if (key === "message_number") {
            setFormData((prev) => ({
                ...prev,
                [key]: value,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [key]: value,
            }));
        }
    };

    const generateCode = () => {
        const date = new Date().getTime().toString().slice(-3);
        const rand = Math.floor(10 + Math.random() * 90);
        return date + rand;
    };

    const handleSubmit = async () => {
        if (!user) return;

        try {
            const submission = {
                requirment_id: "",
                user_id: user.user_id,
                code: generateCode(),
                lead_person: user.username,
                plot_size: selectedPlot,
                ...formData,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "submissions"), submission);
            alert("Submitted successfully!");
            setFormData({
                special_notes: [],
                color: [],
                scope: [],
                starting_time: "",
                phone_1: "",
                phone_2: "",
                message_number: "",
                district: "",
                location: "",
                // plot_size: "",
                project_size: [],
                rooms: [],
                budget: "",
            });
            setSelectedPlot(null);
        } catch (err) {
            console.error("Error saving submission:", err);
            alert("Error saving submission!");
        }
    };

    if (!user) return <p>Loading user...</p>;

    return (
        <div className="requirments_form">
            {/* Special Notes */}
            <div className="field">
                <label>Special Notes</label>
                <CreatableSelect
                    isMulti
                    options={specialNotes}
                    onChange={(val) => handleSelectChange("special_notes", val)}
                />
            </div>

            {/* Color */}
            <div className="field">
                <label>Color</label>
                <CreatableSelect
                    isMulti
                    options={colourOptions}
                    onChange={(val) => handleSelectChange("color", val)}
                />
            </div>

            {/* Scope */}
            <div className="field">
                <label>Scope</label>
                <CreatableSelect
                    isMulti
                    options={scopeOptions}
                    onChange={(val) => handleSelectChange("scope", val)}
                />
            </div>

            {/* Starting Time */}
            <div className="field">
                <label>Starting time</label>
                <CreatableSelect
                    options={startingTime}
                    onChange={(val) =>
                        handleInputChange("starting_time", (val as any)?.value || "")
                    }
                />
            </div>

            {/* Phone 1 */}
            <div className="field">
                <label>Phone 1</label>
                <PhoneInput
                    country={"in"}
                    value={formData.phone_1}
                    onChange={(value) => handleInputChange("phone_1", value)}
                />
                <button
                    type="button"
                    onClick={() =>
                        handleInputChange("message_number", formData.phone_1)
                    }
                >
                    Use for WhatsApp
                </button>
            </div>

            {/* Phone 2 */}
            <div className="field">
                <label>Phone 2</label>
                <PhoneInput
                    country={"in"}
                    value={formData.phone_2}
                    onChange={(value) => handleInputChange("phone_2", value)}
                />
                <button
                    type="button"
                    onClick={() =>
                        handleInputChange("message_number", formData.phone_2)
                    }
                >
                    Use for WhatsApp
                </button>
            </div>

            {/* WhatsApp Number */}
            <div className="field">
                <label>WhatsApp Number</label>
                <PhoneInput
                    country={"in"}
                    value={formData.message_number}
                    onChange={(value) => handleInputChange("message_number", value)}
                />
            </div>

            {/* District */}
            <div className="field">
                <label>District</label>
                <CreatableSelect
                    options={districts}
                    onChange={(val) =>
                        handleInputChange("district", (val as any)?.value || "")
                    }
                />
            </div>

            {/* Location */}
            <div className="field">
                <label>Your Location</label>
                <input
                    placeholder="Enter location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                />
            </div>

            {/* Plot Size */}
            <div className="field">
                <label>Plot Size</label>
                <div className="plot_size_radios">
                    {["Plot to purchase", "Already purchased"].map((val) => (
                        <div key={val}>
                            <input
                                type="radio"
                                name="plot"
                                checked={selectedPlot === val}
                                onChange={() =>
                                    setSelectedPlot(selectedPlot === val ? null : val)
                                }
                            />
                            <label>{val}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Size */}
            <div className="field">
                <label>Project Size</label>
                <CreatableSelect
                    isMulti
                    options={projectSize}
                    onChange={(val) => handleSelectChange("project_size", val)}
                />
            </div>

            {/* Rooms */}
            <div className="field">
                <label>Rooms</label>
                <CreatableSelect
                    isMulti
                    options={rooms}
                    onChange={(val) => handleSelectChange("rooms", val)}
                />
            </div>

            {/* Budget */}
            <div className="field">
                <label>Budget</label>
                <input
                    placeholder="Enter Budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                />
            </div>

            <button onClick={handleSubmit} className="btn">
                Submit
            </button>
        </div>
    );
};

export default RequirmentsForm;







// import CreatableSelect from 'react-select/creatable';
// import { colourOptions, districts, projectSize, rooms, scopeOptions, specialNotes, startingTime } from '../data';
// import "./pages.scss"
// import { useUser } from '../context/UserContext';


// const RequirmentsForm = () => {
//     const handleSubmit = () => { }

//     const user = useUser();
//     console.log("user: ", user)

//     if (!user) return <p>Loading user...</p>;

//     return (
//         <div className='requirments_form' >
//             <div className="field" >
//                 <label htmlFor="">Special Notes</label>
//                 <CreatableSelect isMulti options={specialNotes} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Color</label>
//                 <CreatableSelect isMulti options={colourOptions} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Scope</label>
//                 <CreatableSelect isMulti options={scopeOptions} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Starting time</label>
//                 <CreatableSelect isMulti options={startingTime} />
//             </div>

//             <div className="field">
//                 <div>
//                     <label className="label">Phone 1</label>
//                     <div>
//                         <input type="checkbox" name="" id="" />
//                         <label htmlFor="">(Have whatsapp)</label>
//                     </div>
//                 </div>
//                 <input className="input" placeholder='Phone number' onChange={() => console.log("phone")} />
//             </div>

//             <div className="field">
//                 <label className="label">Whatsapp Number</label>
//                 <input className="input" placeholder='Whats app number' onChange={() => console.log("phone")} />
//             </div>

//             <div className="field">
//                 <label className="label">Phone 2</label>
//                 <input className="input" placeholder='Enter you location' onChange={() => console.log("location")} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Districts</label>
//                 <CreatableSelect isMulti options={districts} />
//             </div>

//             <div className="field">
//                 <label className="label">Your Location</label>
//                 <input className="input" placeholder='Enter you location' onChange={() => console.log("location")} />
//             </div>

//             <div className="field">
//                 <label className="label">Plot size</label>
//                 <div className='plot_size_radios' >
//                     <div>
//                         <input type="radio" name="" id="" />
//                         <label htmlFor="">Plot to purchase</label>
//                     </div>
//                     <div>
//                         <input type="radio" name="" id="" />
//                         <label htmlFor="">Already purchased</label>
//                     </div>
//                 </div>
//                 <input className="input" placeholder='Enter you location' onChange={() => console.log("location")} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Project Size</label>
//                 <CreatableSelect isMulti options={projectSize} />
//             </div>

//             <div className="field" >
//                 <label htmlFor="">Districts</label>
//                 <CreatableSelect isMulti options={rooms} />
//             </div>

//             <div className="field">
//                 <label className="label">Budget</label>
//                 <input className="input" placeholder='Enter Budget' onChange={() => console.log("Budget")} />
//             </div>


//             <button onClick={handleSubmit} className="btn">
//                 Submit
//             </button>
//         </div>
//     )
// }
// export default RequirmentsForm;