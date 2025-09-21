import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useUser } from "../context/UserContext";

interface Submission {
    id: string;
    code: string;
    createdAt: any;
    message_number: string;
    budget: string;
    location: string;
    [key: string]: any;
}

const Submissions = () => {
    const user = useUser();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

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
                            <th className="px-4 py-2 border">Code</th>
                            <th className="px-4 py-2 border">Created At</th>
                            <th className="px-4 py-2 border">WhatsApp Number</th>
                            <th className="px-4 py-2 border">Location</th>
                            <th className="px-4 py-2 border">Budget</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border">{sub.code}</td>
                                <td className="px-4 py-2 border">
                                    {sub.createdAt?.toDate
                                        ? sub.createdAt.toDate().toLocaleString()
                                        : sub.createdAt}
                                </td>
                                <td className="px-4 py-2 border">{sub.message_number}</td>
                                <td className="px-4 py-2 border">{sub.location}</td>
                                <td className="px-4 py-2 border">{sub.budget}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Submissions;
