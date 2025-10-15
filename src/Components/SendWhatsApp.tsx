import { useState } from "react";

const SendWhatsApp = () => {
    const [name, setName] = useState("");
    const [service, setService] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");

        const token = "EAAQZBr44sSeoBPnNQfuZCSTu5j1tIsAUdZBzcv8VFVO4bL3qD5AKZBKV7QeZCWNGFpo5CZBG6X4OHV3JVdJbnENcttaHjxgEMDGq40c1iIhFmZBtDVn1MHnqkFLsKATZBBXwEbHo6ZA2KjqLhq7BuZAJ7es3SfjDfgPypidQGPQLwizUWeW6XqjVM2aXEC6XHJtc8WpKHigT0AaKG6LiRNZAnsfbCbME5ZBd2hgorFhZCdAqZACXvQewZDZD"
        const phoneNumberId = "866342399887735"

        try {
            const response = await fetch(
                `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: phone,
                        type: "template",
                        template: {
                            name: "vanitha_veedu",
                            language: { code: "en_US" },
                            components: [
                                {
                                    type: "header",
                                    parameters: [{ type: "text", text: name }],
                                },
                                {
                                    type: "body",
                                    parameters: [{ type: "text", text: service }],
                                },
                            ],
                        },
                    }),
                }
            );

            const data = await response.json();
            console.log("WhatsApp Response:", data);

            if (data.messages) {
                setStatus("Message sent successfully!");
            } else {
                setStatus("Message failed. Check console for details.");
            }
        } catch (err) {
            console.error("Error:", err);
            setStatus("Error sending message.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSend}
            className="flex flex-col gap-3 p-4 w-[320px] bg-white rounded-xl shadow"
        >
            <h2 className="font-bold text-xl mb-2">Send WhatsApp Message</h2>

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 rounded"
                required
            />

            <input
                type="text"
                placeholder="Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="border p-2 rounded"
                required
            />

            <input
                type="text"
                placeholder="Phone (e.g. 919961260138)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded"
                required
            />

            <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white p-2 rounded disabled:opacity-60"
            >
                {loading ? "Sending..." : "Send WhatsApp"}
            </button>

            {status && <p className="text-sm mt-1">{status}</p>}
        </form>
    );
};

export default SendWhatsApp;
