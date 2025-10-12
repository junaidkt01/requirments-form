import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useUser } from "../context/UserContext";

interface Submission {
    id: string;
    budget: string;
    code: string;
    color: string[];
    createdAt: any;
    name_of_client: string;
    district: any;
    lead_person: any;
    location: string;
    message_number: string;
    phone_1: string;
    phone_2: string;
    plot_size: string;
    project_size: string[];
    remarks: string;
    requirment_id: string;
    rooms: string[];
    scope: string[];
    special_notes: string[];
    starting_time: string[];
    user_id: string[];
    isSendMessage: string[];
    [key: string]: any;
}

const Submissions = () => {
    const user = useUser();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    console.log("submissions: ", submissions);

    const fetchSubmissions = async () => {
        if (!user) return;
        setLoading(true);
        const q = query(
            collection(db, "submissions"),
            where("user_id", "==", user.user_id)
        );
        const snapshot = await getDocs(q);
        const data: Submission[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Submission[];
        setSubmissions(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubmissions();
    }, [user]);

    const exportToExcel = () => {
        if (!submissions.length) return;
        const worksheet = XLSX.utils.json_to_sheet(submissions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, "submissions.xlsx");
    };

    if (!user) return <p>Loading user...</p>;
    if (loading) return <p>Loading submissions...</p>;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Your Submissions</h2>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={exportToExcel}
                >
                    Export to Excel
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border text-nowrap">SL No</th>
                            <th className="px-4 py-2 border text-nowrap">Code</th>
                            <th className="px-4 py-2 border text-nowrap">Lead person</th>
                            <th className="px-4 py-2 border text-nowrap">Date</th>
                            <th className="px-4 py-2 border text-nowrap">Time</th>
                            <th className="px-4 py-2 border text-nowrap">Name of client</th>
                            <th className="px-4 py-2 border text-nowrap">Scope</th>
                            <th className="px-4 py-2 border text-nowrap">Starting time</th>
                            <th className="px-4 py-2 border text-nowrap">Phone No.</th>
                            <th className="px-4 py-2 border text-nowrap">District</th>
                            <th className="px-4 py-2 border text-nowrap">Location</th>
                            <th className="px-4 py-2 border text-nowrap">Plot</th>
                            <th className="px-4 py-2 border text-nowrap">Project size</th>
                            <th className="px-4 py-2 border text-nowrap">Remarks</th>
                            <th className="px-4 py-2 border text-nowrap">Rooms</th>
                            <th className="px-4 py-2 border text-nowrap">Budget</th>
                            <th className="px-4 py-2 border text-nowrap">Special notes</th>
                            <th className="px-4 py-2 border text-nowrap">Colour</th>
                            <th className="px-4 py-2 border text-nowrap">Send Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((sub, i) => (
                            <tr key={sub.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border text-nowrap">{i + 1}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.code}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.lead_person}</td>
                                <td className="px-4 py-2 border text-nowrap">{
                                    sub.createdAt.toDate().toLocaleString().split(",")[0]
                                }</td>
                                <td className="px-4 py-2 border text-nowrap">{
                                    sub.createdAt.toDate().toLocaleString().split(",")[1]
                                }</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.name_of_client}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.scope}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.starting_time}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.phone_1} / {sub.phone_2}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.district}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.location}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.plot_size}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.project_size.map((item, i) => <span key={i} >{item}, </span>)}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.remarks}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.rooms}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.budget}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.special_notes}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.color}</td>
                                <td className="px-4 py-2 border text-nowrap">{sub.isSendMessage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Submissions;
