import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Plus,
    Trash2,
    Copy,
    Settings,
    Eye,
    Save,
    Send,
    GripVertical,
    Type,
    List,
    CheckSquare,
    Calendar,
    Mail,
    Phone,
    Hash,
    FileText,
    Star,
    ToggleLeft,
    Image,
    Link,
    DollarSign,
    Download,
} from "lucide-react";

type FieldType =
    | "text"
    | "textarea"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio"
    | "date"
    | "email"
    | "phone"
    | "number"
    | "file"
    | "rating"
    | "toggle"
    | "url"
    | "currency";

interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    description?: string;
}

interface FormData {
    title: string;
    description?: string;
    fields: FormField[];
}

interface SubmissionData {
    [key: string]: any;
    submittedAt: string;
}

const FIELD_TYPES = [
    { type: "text", label: "Text Input", icon: Type },
    { type: "textarea", label: "Textarea", icon: Type },
    { type: "select", label: "Dropdown", icon: List },
    { type: "multiselect", label: "Multi-Select", icon: CheckSquare },
    { type: "radio", label: "Radio Buttons", icon: ToggleLeft },
    { type: "checkbox", label: "Checkboxes", icon: CheckSquare },
    { type: "date", label: "Date Picker", icon: Calendar },
    { type: "email", label: "Email", icon: Mail },
    { type: "phone", label: "Phone", icon: Phone },
    { type: "number", label: "Number", icon: Hash },
    { type: "currency", label: "Currency", icon: DollarSign },
    { type: "url", label: "URL", icon: Link },
    { type: "file", label: "File Upload", icon: Image },
    { type: "rating", label: "Rating", icon: Star },
    { type: "toggle", label: "Toggle Switch", icon: ToggleLeft },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Default business form inferred from uploaded XLSX (fields simplified).
 * You can tweak labels/options as you like.
 */
const DEFAULT_BUSINESS_FORM: FormData = {
    title: "Business - Client Lead Form",
    description: "Collect client requirements and project details",
    fields: [
        { id: "f1", type: "text", label: "Client Name", placeholder: "Full name", required: true },
        { id: "f2", type: "phone", label: "Phone Number", placeholder: "Mobile number", required: true },
        { id: "f3", type: "email", label: "Email", placeholder: "Email address" },
        { id: "f4", type: "text", label: "Lead Code", placeholder: "Code / Reference" },
        { id: "f5", type: "select", label: "Lead Generator", options: ["Albin", "Jino", "Sidarth", "Other"], placeholder: "Who referred?" },
        { id: "f6", type: "date", label: "Contact Date", placeholder: "Select date" },
        { id: "f7", type: "text", label: "Project Scope", placeholder: "e.g. Interior / Exterior / Full build" },
        { id: "f8", type: "textarea", label: "Special Notes", placeholder: "Any special notes / urgency" },
        { id: "f9", type: "select", label: "Category", options: ["Immediate", "Planning", "Follow-up"] },
        { id: "f10", type: "select", label: "Project Size", options: ["Plot to purchase", "Design required", "Construction"] },
        { id: "f11", type: "select", label: "Rooms", options: ["1BHK", "2BHK", "3BHK", "Other"] },
        { id: "f12", type: "currency", label: "Budget", placeholder: "Estimated budget" },
        { id: "f13", type: "file", label: "Attachments (Photos / Plans)" },
    ],
};

const STORAGE_KEY_SCHEMA = "advanced_form_schema_v1";
const STORAGE_KEY_SUBMISSIONS = "advanced_form_submissions_v1";

const AdvancedFormBuilder: React.FC = () => {
    const [mode, setMode] = useState<"builder" | "preview" | "submissions">("builder");

    // load saved schema or default business form
    const [formData, setFormData] = useState<FormData>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SCHEMA);
            if (raw) return JSON.parse(raw) as FormData;
        } catch { }
        return DEFAULT_BUSINESS_FORM;
    });

    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [draggedField, setDraggedField] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<SubmissionData[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
            if (raw) return JSON.parse(raw) as SubmissionData[];
        } catch { }
        return [];
    });

    // single object that stores current preview form values
    const [formValues, setFormValues] = useState<{ [key: string]: any }>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // persist schema and submissions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_SCHEMA, JSON.stringify(formData));
        } catch { }
    }, [formData]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
        } catch { }
    }, [submissions]);

    // Reset preview values when switching to preview mode
    useEffect(() => {
        if (mode === "preview") {
            // initialize default values shapes for consistent controlled components
            const init: { [k: string]: any } = {};
            formData.fields.forEach((f) => {
                if (f.type === "checkbox" || f.type === "multiselect") init[f.id] = [];
                else if (f.type === "rating") init[f.id] = 0;
                else if (f.type === "toggle") init[f.id] = false;
                else init[f.id] = "";
            });
            setFormValues(init);
        }
    }, [mode, formData.fields]);

    const addField = useCallback((type: FieldType) => {
        const newField: FormField = {
            id: generateId(),
            type,
            label: FIELD_TYPES.find((t) => t.type === type)?.label || "Field",
            required: false,
            placeholder: type === "textarea" ? "Enter your response..." : "Enter value...",
            options: ["select", "multiselect", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : undefined,
        };
        setFormData((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
        setSelectedField(newField.id);
    }, []);

    const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
        setFormData((prev) => ({
            ...prev,
            fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
        }));
    }, []);

    const deleteField = useCallback((fieldId: string) => {
        setFormData((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== fieldId) }));
        setSelectedField((id) => (id === fieldId ? null : id));
    }, []);

    const duplicateField = useCallback(
        (fieldId: string) => {
            const field = formData.fields.find((f) => f.id === fieldId);
            if (!field) return;
            const copy: FormField = { ...field, id: generateId(), label: `${field.label} (Copy)` };
            // duplicate near the original index
            setFormData((prev) => {
                const idx = prev.fields.findIndex((f) => f.id === fieldId);
                const newFields = [...prev.fields];
                newFields.splice(idx + 1, 0, copy);
                return { ...prev, fields: newFields };
            });
        },
        [formData.fields]
    );

    const moveField = useCallback((fromIndex: number, toIndex: number) => {
        setFormData((prev) => {
            const newFields = [...prev.fields];
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= newFields.length || toIndex >= newFields.length) return prev;
            const [removed] = newFields.splice(fromIndex, 1);
            newFields.splice(toIndex, 0, removed);
            return { ...prev, fields: newFields };
        });
    }, []);

    // drag handlers
    const handleDragStart = (e: React.DragEvent, fieldId: string) => {
        setDraggedField(fieldId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
        e.preventDefault();
        if (!draggedField || draggedField === targetFieldId) {
            setDraggedField(null);
            return;
        }
        const fromIndex = formData.fields.findIndex((f) => f.id === draggedField);
        const toIndex = formData.fields.findIndex((f) => f.id === targetFieldId);
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
            moveField(fromIndex, toIndex);
        }
        setDraggedField(null);
    };

    // form submission (preview)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // basic required validation
        for (const field of formData.fields) {
            if (field.required) {
                const v = formValues[field.id];
                const empty =
                    v === undefined ||
                    v === null ||
                    (typeof v === "string" && v.trim() === "") ||
                    (Array.isArray(v) && v.length === 0);
                if (empty) {
                    alert(`Please fill the required field: ${field.label}`);
                    return;
                }
            }
        }

        const submission: SubmissionData = {
            ...formValues,
            submittedAt: new Date().toISOString(),
        };

        setSubmissions((prev) => [...prev, submission]);
        // keep submissions persistent => already handled by effect
        alert("Form submitted successfully!");
        // clear preview values
        const cleared: { [k: string]: any } = {};
        formData.fields.forEach((f) => {
            if (f.type === "checkbox" || f.type === "multiselect") cleared[f.id] = [];
            else if (f.type === "rating") cleared[f.id] = 0;
            else if (f.type === "toggle") cleared[f.id] = false;
            else cleared[f.id] = "";
        });
        setFormValues(cleared);
    };

    // helpers for submission CSV export
    const exportSubmissionsCSV = () => {
        if (!submissions.length) {
            alert("No submissions to export");
            return;
        }
        const headers = ["submittedAt", ...formData.fields.map((f) => f.label)];
        const rows = submissions.map((sub) =>
            [
                sub.submittedAt,
                ...formData.fields.map((f) => {
                    const cell = sub[f.id];
                    if (cell == null) return "";
                    if (Array.isArray(cell)) return cell.join("|");
                    if (cell instanceof File) return (cell as File).name;
                    return String(cell);
                }),
            ].join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formData.title.replace(/\s+/g, "_")}_submissions.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // controlled change handlers for preview fields
    const handleChangeValue = (field: FormField, value: any) => {
        setFormValues((prev) => ({ ...prev, [field.id]: value }));
    };

    // Renderers

    const renderFormField = (field: FormField, isPreview = false) => {
        // value must be defined to avoid uncontrolled -> controlled warnings
        const value = formValues[field.id];

        const baseInputClass =
            "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

        // helpers for option-based types
        const renderOptions = () =>
            (field.options || []).map((option, idx) => (
                <option key={idx} value={option}>
                    {option}
                </option>
            ));

        switch (field.type) {
            case "text":
            case "email":
            case "phone":
            case "url":
                return (
                    <input
                        type={field.type === "phone" ? "tel" : field.type}
                        value={value ?? ""}
                        placeholder={field.placeholder ?? ""}
                        required={field.required}
                        className={baseInputClass}
                        onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                    />
                );

            case "textarea":
                return (
                    <textarea
                        value={value ?? ""}
                        placeholder={field.placeholder ?? ""}
                        required={field.required}
                        rows={4}
                        className={baseInputClass}
                        onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                    />
                );

            case "number":
            case "currency":
                return (
                    <div className="relative">
                        {field.type === "currency" && (
                            <div className="absolute left-3 top-3 text-gray-500 pointer-events-none">₹</div>
                        )}
                        <input
                            type="number"
                            value={value ?? ""}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            placeholder={field.placeholder ?? ""}
                            required={field.required}
                            className={`${baseInputClass} ${field.type === "currency" ? "pl-10" : ""}`}
                            onChange={(e) => isPreview && handleChangeValue(field, e.target.value === "" ? "" : Number(e.target.value))}
                        />
                    </div>
                );

            case "date":
                return (
                    <input
                        type="date"
                        value={value ?? ""}
                        placeholder={field.placeholder ?? ""}
                        required={field.required}
                        className={baseInputClass}
                        onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                    />
                );

            case "select":
                return (
                    <select
                        value={value ?? ""}
                        required={field.required}
                        className={baseInputClass}
                        onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                    >
                        <option value="">{field.placeholder ?? "Choose an option"}</option>
                        {renderOptions()}
                    </select>
                );

            case "multiselect":
                return (
                    <select
                        multiple
                        value={Array.isArray(value) ? value : []}
                        required={field.required && (value ?? []).length === 0}
                        className={`${baseInputClass}`}
                        size={Math.min((field.options || []).length || 3, 6)}
                        onChange={(e) => {
                            if (!isPreview) return;
                            const selected: string[] = Array.from(e.target.selectedOptions).map((o) => o.value);
                            handleChangeValue(field, selected);
                        }}
                    >
                        {renderOptions()}
                    </select>
                );

            case "radio":
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((option, idx) => (
                            <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={option}
                                    checked={value === option}
                                    onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case "checkbox":
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((option, idx) => {
                            const arr: string[] = Array.isArray(value) ? value : [];
                            return (
                                <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={arr.includes(option)}
                                        onChange={(e) => {
                                            if (!isPreview) return;
                                            const checked = e.target.checked;
                                            const current = Array.isArray(value) ? value.slice() : [];
                                            const next = checked ? [...current, option] : current.filter((v) => v !== option);
                                            handleChangeValue(field, next);
                                        }}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case "rating":
                return (
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => isPreview && handleChangeValue(field, star)}
                                className={`text-2xl ${((value ?? 0) >= star ? "text-yellow-400" : "text-gray-300")} hover:text-yellow-500 transition-colors`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                );

            case "toggle":
                return (
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => isPreview && handleChangeValue(field, e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-gray-300"}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${value ? "translate-x-6" : ""}`}></div>
                        </div>
                        <span className="ml-3 text-gray-700">Enable</span>
                    </label>
                );

            case "file":
                return (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                if (!isPreview) return;
                                const f = e.target.files?.[0] ?? null;
                                handleChangeValue(field, f);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Click to upload
                        </button>
                        {value && typeof value === "object" && (value as File).name && (
                            <p className="text-sm text-gray-600 mt-2">Selected: {(value as File).name}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-2">PNG, JPG, PDF up to 10MB</p>
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value ?? ""}
                        placeholder={field.placeholder ?? ""}
                        required={field.required}
                        className={baseInputClass}
                        onChange={(e) => isPreview && handleChangeValue(field, e.target.value)}
                    />
                );
        }
    };

    const FieldEditor: React.FC<{ field: FormField | undefined }> = ({ field }) => {
        if (!field)
            return (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Settings</h3>
                    <p className="text-gray-500">Select a field to edit its properties</p>
                </div>
            );

        return (
            <div className="bg-white p-6 border-l-4 border-indigo-500 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                        <input
                            type="text"
                            value={field.placeholder ?? ""}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={field.description ?? ""}
                            onChange={(e) => updateField(field.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={2}
                        />
                    </div>

                    {["select", "multiselect", "radio", "checkbox"].includes(field.type) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                            {(field.options || []).map((option, idx) => (
                                <div key={idx} className="flex mb-2">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...(field.options || [])];
                                            newOptions[idx] = e.target.value;
                                            updateField(field.id, { options: newOptions });
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newOptions = (field.options || []).filter((_, i) => i !== idx);
                                            updateField(field.id, { options: newOptions });
                                        }}
                                        className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    const newOptions = [...(field.options || []), `Option ${(field.options || []).length + 1}`];
                                    updateField(field.id, { options: newOptions });
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                + Add Option
                            </button>
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={!!field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`required-${field.id}`} className="ml-2 text-sm text-gray-700">
                            Required field
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    // UI layout (kept your structure)
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">Form Builder Pro</h1>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setMode("builder")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === "builder" ? "bg-indigo-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
                                >
                                    <Settings className="w-4 h-4 inline mr-2" />
                                    Builder
                                </button>
                                <button
                                    onClick={() => setMode("preview")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === "preview" ? "bg-indigo-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
                                >
                                    <Eye className="w-4 h-4 inline mr-2" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => setMode("submissions")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === "submissions" ? "bg-indigo-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
                                >
                                    <FileText className="w-4 h-4 inline mr-2" />
                                    Submissions ({submissions.length})
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    // Save action: already saved to localStorage automatically
                                    alert("Form saved locally (auto-saved). Use Share to export or implement backend save.");
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Form
                            </button>
                            <button
                                onClick={() => {
                                    // quick export schema as JSON
                                    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${formData.title.replace(/\s+/g, "_")}_schema.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Send className="w-4 h-4 inline mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {mode === "builder" && (
                    <div className="grid grid-cols-12 gap-8">
                        {/* Field Types Sidebar */}
                        <div className="col-span-3">
                            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Fields</h3>
                                <div className="space-y-2">
                                    {FIELD_TYPES.map((fieldType) => {
                                        const Icon = fieldType.icon;
                                        return (
                                            <button
                                                key={fieldType.type}
                                                onClick={() => addField(fieldType.type as FieldType)}
                                                className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group"
                                            >
                                                <Icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-indigo-600" />
                                                <span className="text-sm font-medium">{fieldType.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(DEFAULT_BUSINESS_FORM);
                                            setSelectedField(null);
                                            alert("Default business form loaded.");
                                        }}
                                        className="mt-2 w-full px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                                    >
                                        Load Business Template
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Builder */}
                        <div className="col-span-6">
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                {/* Form Header */}
                                <div className="mb-8 pb-6 border-b border-gray-200">
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        className="text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-2"
                                        placeholder="Form Title"
                                    />
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        className="text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 w-full resize-none"
                                        placeholder="Form description..."
                                        rows={2}
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {formData.fields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, field.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, field.id)}
                                            className={`group relative p-6 border-2 rounded-lg transition-all duration-200 cursor-pointer ${selectedField === field.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            onClick={() => setSelectedField(field.id)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                                    <span className="font-medium text-gray-800">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </span>
                                                </div>
                                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            duplicateField(field.id);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteField(field.id);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {field.description && <p className="text-sm text-gray-600 mb-3">{field.description}</p>}

                                            {/* Render a non-editable preview (builder-time) so the builder shows field layout.
                          Real interaction happens in 'preview' mode */}
                                            <div>{renderFormField(field, false)}</div>
                                        </div>
                                    ))}

                                    {formData.fields.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg">No fields yet</p>
                                            <p className="text-sm">Add fields from the sidebar to get started</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Field Editor */}
                        <div className="col-span-3">
                            <FieldEditor field={formData.fields.find((f) => f.id === selectedField)} />
                        </div>
                    </div>
                )}

                {mode === "preview" && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div className="mb-8 pb-6 border-b border-gray-200">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title}</h1>
                                <p className="text-gray-600">{formData.description}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {formData.fields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {field.description && <p className="text-sm text-gray-600 mb-3">{field.description}</p>}
                                        {renderFormField(field, true)}
                                    </div>
                                ))}

                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg">
                                        Submit Form
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {mode === "submissions" && (
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Form Submissions</h2>
                            <div className="flex items-center space-x-2">
                                <button onClick={exportSubmissionsCSV} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => {
                                        setSubmissions([]);
                                        alert("Submissions cleared locally.");
                                    }}
                                    className="px-3 py-2 bg-red-600 text-white rounded-md"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No submissions yet</p>
                                <p className="text-sm">Submissions will appear here once users fill out your form</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-300 px-4 py-2 text-left">Submitted At</th>
                                            {formData.fields.map((field) => (
                                                <th key={field.id} className="border border-gray-300 px-4 py-2 text-left">
                                                    {field.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((submission, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2">{new Date(submission.submittedAt).toLocaleString()}</td>
                                                {formData.fields.map((field) => (
                                                    <td key={field.id} className="border border-gray-300 px-4 py-2">
                                                        {(() => {
                                                            const cell = submission[field.id];
                                                            if (cell == null || cell === "") return "-";
                                                            if (Array.isArray(cell)) return cell.join(", ");
                                                            if (cell instanceof File) return (cell as File).name;
                                                            return String(cell);
                                                        })()}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedFormBuilder;


// import React, { useState, useCallback, useRef } from 'react';
// import { Plus, Trash2, Copy, Settings, Eye, Save, Send, GripVertical, Type, List, CheckSquare, Calendar, Mail, Phone, Hash, FileText, Star, ToggleLeft, Image, Link, DollarSign } from 'lucide-react';

// interface FormField {
//     id: string;
//     type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'email' | 'phone' | 'number' | 'file' | 'rating' | 'toggle' | 'url' | 'currency';
//     label: string;
//     placeholder?: string;
//     required: boolean;
//     options?: string[];
//     validation?: {
//         min?: number;
//         max?: number;
//         pattern?: string;
//     };
//     description?: string;
// }

// interface FormData {
//     title: string;
//     description: string;
//     fields: FormField[];
// }

// interface SubmissionData {
//     [key: string]: any;
//     submittedAt: string;
// }

// const FIELD_TYPES = [
//     { type: 'text', label: 'Text Input', icon: Type },
//     { type: 'textarea', label: 'Textarea', icon: FileText },
//     { type: 'select', label: 'Dropdown', icon: List },
//     { type: 'multiselect', label: 'Multi-Select', icon: CheckSquare },
//     { type: 'radio', label: 'Radio Buttons', icon: ToggleLeft },
//     { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
//     { type: 'date', label: 'Date Picker', icon: Calendar },
//     { type: 'email', label: 'Email', icon: Mail },
//     { type: 'phone', label: 'Phone', icon: Phone },
//     { type: 'number', label: 'Number', icon: Hash },
//     { type: 'currency', label: 'Currency', icon: DollarSign },
//     { type: 'url', label: 'URL', icon: Link },
//     { type: 'file', label: 'File Upload', icon: Image },
//     { type: 'rating', label: 'Rating', icon: Star },
//     { type: 'toggle', label: 'Toggle Switch', icon: ToggleLeft },
// ];

// const generateId = () => Math.random().toString(36).substr(2, 9);

// const AdvancedFormBuilder: React.FC = () => {
//     const [mode, setMode] = useState<'builder' | 'preview' | 'submissions'>('builder');
//     const [formData, setFormData] = useState<FormData>({
//         title: 'Untitled Form',
//         description: 'Please fill out this form with your requirements.',
//         fields: []
//     });
//     const [selectedField, setSelectedField] = useState<string | null>(null);
//     const [draggedField, setDraggedField] = useState<string | null>(null);
//     const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
//     const [formValues, setFormValues] = useState<{ [key: string]: any }>({});
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     const addField = useCallback((type: FormField['type']) => {
//         const newField: FormField = {
//             id: generateId(),
//             type,
//             label: `${FIELD_TYPES.find(t => t.type === type)?.label || 'Field'}`,
//             required: false,
//             placeholder: type === 'textarea' ? 'Enter your detailed response...' : 'Enter value...',
//             options: ['select', 'multiselect', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined
//         };

//         setFormData(prev => ({
//             ...prev,
//             fields: [...prev.fields, newField]
//         }));
//         setSelectedField(newField.id);
//     }, []);

//     const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
//         setFormData(prev => ({
//             ...prev,
//             fields: prev.fields.map(field =>
//                 field.id === fieldId ? { ...field, ...updates } : field
//             )
//         }));
//     }, []);

//     const deleteField = useCallback((fieldId: string) => {
//         setFormData(prev => ({
//             ...prev,
//             fields: prev.fields.filter(field => field.id !== fieldId)
//         }));
//         setSelectedField(null);
//     }, []);

//     const duplicateField = useCallback((fieldId: string) => {
//         const field = formData.fields.find(f => f.id === fieldId);
//         if (field) {
//             const newField = { ...field, id: generateId(), label: `${field.label} (Copy)` };
//             setFormData(prev => ({
//                 ...prev,
//                 fields: [...prev.fields, newField]
//             }));
//         }
//     }, [formData.fields]);

//     const moveField = useCallback((fromIndex: number, toIndex: number) => {
//         setFormData(prev => {
//             const newFields = [...prev.fields];
//             const [removed] = newFields.splice(fromIndex, 1);
//             newFields.splice(toIndex, 0, removed);
//             return { ...prev, fields: newFields };
//         });
//     }, []);

//     const handleDragStart = (e: React.DragEvent, fieldId: string) => {
//         setDraggedField(fieldId);
//         e.dataTransfer.effectAllowed = 'move';
//     };

//     const handleDragOver = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.dataTransfer.dropEffect = 'move';
//     };

//     const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
//         e.preventDefault();
//         if (!draggedField || draggedField === targetFieldId) return;

//         const fromIndex = formData.fields.findIndex(f => f.id === draggedField);
//         const toIndex = formData.fields.findIndex(f => f.id === targetFieldId);

//         moveField(fromIndex, toIndex);
//         setDraggedField(null);
//     };

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         const submission: SubmissionData = {
//             ...formValues,
//             submittedAt: new Date().toISOString()
//         };
//         setSubmissions(prev => [...prev, submission]);
//         setFormValues({});
//         alert('Form submitted successfully!');
//     };

//     const renderFormField = (field: FormField, isPreview = false) => {
//         const value = formValues[field.id] || '';

//         const commonProps = {
//             className: "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
//             required: field.required,
//             placeholder: field.placeholder,
//             onChange: isPreview ? (e: any) => {
//                 const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
//                 setFormValues(prev => ({ ...prev, [field.id]: newValue }));
//             } : undefined
//         };

//         switch (field.type) {
//             case 'text':
//             case 'email':
//             case 'phone':
//             case 'url':
//                 return (
//                     <input
//                         type={field.type === 'phone' ? 'tel' : field.type}
//                         value={value}
//                         {...commonProps}
//                     />
//                 );

//             case 'textarea':
//                 return (
//                     <textarea
//                         rows={4}
//                         value={value}
//                         {...commonProps}
//                     />
//                 );

//             case 'number':
//             case 'currency':
//                 return (
//                     <input
//                         type="number"
//                         value={value}
//                         min={field.validation?.min}
//                         max={field.validation?.max}
//                         {...commonProps}
//                         className={`${commonProps.className} ${field.type === 'currency' ? 'pl-8' : ''}`}
//                         style={field.type === 'currency' ? {
//                             background: 'linear-gradient(to right, #f3f4f6 0, #f3f4f6 32px, white 32px)',
//                             backgroundAttachment: 'local',
//                         } : {}}
//                     />
//                 );

//             case 'date':
//                 return (
//                     <input
//                         type="date"
//                         value={value}
//                         {...commonProps}
//                     />
//                 );

//             case 'select':
//                 return (
//                     <select value={value} {...commonProps}>
//                         <option value="">Choose an option</option>
//                         {field.options?.map((option, idx) => (
//                             <option key={idx} value={option}>{option}</option>
//                         ))}
//                     </select>
//                 );

//             case 'multiselect':
//                 return (
//                     <select multiple value={value || []} {...commonProps} size={Math.min(field.options?.length || 3, 5)}>
//                         {field.options?.map((option, idx) => (
//                             <option key={idx} value={option}>{option}</option>
//                         ))}
//                     </select>
//                 );

//             case 'radio':
//                 return (
//                     <div className="space-y-3">
//                         {field.options?.map((option, idx) => (
//                             <label key={idx} className="flex items-center space-x-3 cursor-pointer">
//                                 <input
//                                     type="radio"
//                                     name={field.id}
//                                     value={option}
//                                     checked={value === option}
//                                     onChange={commonProps.onChange}
//                                     className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
//                                 />
//                                 <span className="text-gray-700">{option}</span>
//                             </label>
//                         ))}
//                     </div>
//                 );

//             case 'checkbox':
//                 return (
//                     <div className="space-y-3">
//                         {field.options?.map((option, idx) => (
//                             <label key={idx} className="flex items-center space-x-3 cursor-pointer">
//                                 <input
//                                     type="checkbox"
//                                     value={option}
//                                     checked={(value || []).includes(option)}
//                                     onChange={(e) => {
//                                         if (isPreview) {
//                                             const currentValues = value || [];
//                                             const newValues = e.target.checked
//                                                 ? [...currentValues, option]
//                                                 : currentValues.filter((v: string) => v !== option);
//                                             setFormValues(prev => ({ ...prev, [field.id]: newValues }));
//                                         }
//                                     }}
//                                     className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
//                                 />
//                                 <span className="text-gray-700">{option}</span>
//                             </label>
//                         ))}
//                     </div>
//                 );

//             case 'rating':
//                 return (
//                     <div className="flex space-x-2">
//                         {[1, 2, 3, 4, 5].map((star) => (
//                             <button
//                                 key={star}
//                                 type="button"
//                                 onClick={() => isPreview && setFormValues(prev => ({ ...prev, [field.id]: star }))}
//                                 className={`text-2xl ${value >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
//                             >
//                                 ★
//                             </button>
//                         ))}
//                     </div>
//                 );

//             case 'toggle':
//                 return (
//                     <label className="flex items-center cursor-pointer">
//                         <div className="relative">
//                             <input
//                                 type="checkbox"
//                                 checked={value || false}
//                                 onChange={commonProps.onChange}
//                                 className="sr-only"
//                             />
//                             <div className={`block w-14 h-8 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
//                             <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${value ? 'translate-x-6' : ''}`}></div>
//                         </div>
//                         <span className="ml-3 text-gray-700">Enable</span>
//                     </label>
//                 );

//             case 'file':
//                 return (
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
//                         <input
//                             ref={fileInputRef}
//                             type="file"
//                             className="hidden"
//                             onChange={commonProps.onChange}
//                         />
//                         <button
//                             type="button"
//                             onClick={() => fileInputRef.current?.click()}
//                             className="text-indigo-600 hover:text-indigo-800 font-medium"
//                         >
//                             Click to upload or drag and drop
//                         </button>
//                         <p className="text-gray-500 text-sm mt-2">PNG, JPG, PDF up to 10MB</p>
//                     </div>
//                 );

//             default:
//                 return <input type="text" {...commonProps} />;
//         }
//     };

//     const FieldEditor = ({ field }: { field: FormField }) => (
//         <div className="bg-white p-6 border-l-4 border-indigo-500 rounded-lg shadow-sm">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Settings</h3>

//             <div className="space-y-4">
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
//                     <input
//                         type="text"
//                         value={field.label}
//                         onChange={(e) => updateField(field.id, { label: e.target.value })}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                     />
//                 </div>

//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
//                     <input
//                         type="text"
//                         value={field.placeholder || ''}
//                         onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                     />
//                 </div>

//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//                     <textarea
//                         value={field.description || ''}
//                         onChange={(e) => updateField(field.id, { description: e.target.value })}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                         rows={2}
//                     />
//                 </div>

//                 {(['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)) && (
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
//                         {field.options?.map((option, idx) => (
//                             <div key={idx} className="flex mb-2">
//                                 <input
//                                     type="text"
//                                     value={option}
//                                     onChange={(e) => {
//                                         const newOptions = [...(field.options || [])];
//                                         newOptions[idx] = e.target.value;
//                                         updateField(field.id, { options: newOptions });
//                                     }}
//                                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         const newOptions = field.options?.filter((_, i) => i !== idx);
//                                         updateField(field.id, { options: newOptions });
//                                     }}
//                                     className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
//                                 >
//                                     <Trash2 className="w-4 h-4" />
//                                 </button>
//                             </div>
//                         ))}
//                         <button
//                             type="button"
//                             onClick={() => {
//                                 const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
//                                 updateField(field.id, { options: newOptions });
//                             }}
//                             className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
//                         >
//                             + Add Option
//                         </button>
//                     </div>
//                 )}

//                 <div className="flex items-center">
//                     <input
//                         type="checkbox"
//                         id="required"
//                         checked={field.required}
//                         onChange={(e) => updateField(field.id, { required: e.target.checked })}
//                         className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
//                     />
//                     <label htmlFor="required" className="ml-2 text-sm text-gray-700">Required field</label>
//                 </div>
//             </div>
//         </div>
//     );

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
//             {/* Header */}
//             <div className="bg-white shadow-sm border-b">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex justify-between items-center py-4">
//                         <div className="flex items-center space-x-4">
//                             <h1 className="text-2xl font-bold text-gray-900">Form Builder Pro</h1>
//                             <div className="flex space-x-2">
//                                 <button
//                                     onClick={() => setMode('builder')}
//                                     className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === 'builder'
//                                         ? 'bg-indigo-600 text-white shadow-md'
//                                         : 'text-gray-700 hover:bg-gray-100'
//                                         }`}
//                                 >
//                                     <Settings className="w-4 h-4 inline mr-2" />
//                                     Builder
//                                 </button>
//                                 <button
//                                     onClick={() => setMode('preview')}
//                                     className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === 'preview'
//                                         ? 'bg-indigo-600 text-white shadow-md'
//                                         : 'text-gray-700 hover:bg-gray-100'
//                                         }`}
//                                 >
//                                     <Eye className="w-4 h-4 inline mr-2" />
//                                     Preview
//                                 </button>
//                                 <button
//                                     onClick={() => setMode('submissions')}
//                                     className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === 'submissions'
//                                         ? 'bg-indigo-600 text-white shadow-md'
//                                         : 'text-gray-700 hover:bg-gray-100'
//                                         }`}
//                                 >
//                                     <FileText className="w-4 h-4 inline mr-2" />
//                                     Submissions ({submissions.length})
//                                 </button>
//                             </div>
//                         </div>
//                         <div className="flex space-x-3">
//                             <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
//                                 <Save className="w-4 h-4 inline mr-2" />
//                                 Save Form
//                             </button>
//                             <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
//                                 <Send className="w-4 h-4 inline mr-2" />
//                                 Share
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 {mode === 'builder' && (
//                     <div className="grid grid-cols-12 gap-8">
//                         {/* Field Types Sidebar */}
//                         <div className="col-span-3">
//                             <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
//                                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Fields</h3>
//                                 <div className="space-y-2">
//                                     {FIELD_TYPES.map((fieldType) => {
//                                         const Icon = fieldType.icon;
//                                         return (
//                                             <button
//                                                 key={fieldType.type}
//                                                 onClick={() => addField(fieldType.type)}
//                                                 className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group"
//                                             >
//                                                 <Icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-indigo-600" />
//                                                 <span className="text-sm font-medium">{fieldType.label}</span>
//                                             </button>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Form Builder */}
//                         <div className="col-span-6">
//                             <div className="bg-white rounded-xl shadow-sm p-8">
//                                 {/* Form Header */}
//                                 <div className="mb-8 pb-6 border-b border-gray-200">
//                                     <input
//                                         type="text"
//                                         value={formData.title}
//                                         onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
//                                         className="text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-2"
//                                         placeholder="Form Title"
//                                     />
//                                     <textarea
//                                         value={formData.description}
//                                         onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                                         className="text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 w-full resize-none"
//                                         placeholder="Form description..."
//                                         rows={2}
//                                     />
//                                 </div>

//                                 {/* Form Fields */}
//                                 <div className="space-y-6">
//                                     {formData.fields.map((field, index) => (
//                                         <div
//                                             key={field.id}
//                                             draggable
//                                             onDragStart={(e) => handleDragStart(e, field.id)}
//                                             onDragOver={handleDragOver}
//                                             onDrop={(e) => handleDrop(e, field.id)}
//                                             className={`group relative p-6 border-2 rounded-lg transition-all duration-200 cursor-pointer ${selectedField === field.id
//                                                 ? 'border-indigo-500 bg-indigo-50'
//                                                 : 'border-gray-200 hover:border-gray-300'
//                                                 }`}
//                                             onClick={() => setSelectedField(field.id)}
//                                         >
//                                             <div className="flex items-center justify-between mb-4">
//                                                 <div className="flex items-center space-x-3">
//                                                     <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
//                                                     <span className="font-medium text-gray-800">
//                                                         {field.label}
//                                                         {field.required && <span className="text-red-500 ml-1">*</span>}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                                                     <button
//                                                         onClick={(e) => {
//                                                             e.stopPropagation();
//                                                             duplicateField(field.id);
//                                                         }}
//                                                         className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
//                                                     >
//                                                         <Copy className="w-4 h-4" />
//                                                     </button>
//                                                     <button
//                                                         onClick={(e) => {
//                                                             e.stopPropagation();
//                                                             deleteField(field.id);
//                                                         }}
//                                                         className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
//                                                     >
//                                                         <Trash2 className="w-4 h-4" />
//                                                     </button>
//                                                 </div>
//                                             </div>

//                                             {field.description && (
//                                                 <p className="text-sm text-gray-600 mb-3">{field.description}</p>
//                                             )}

//                                             {renderFormField(field)}
//                                         </div>
//                                     ))}

//                                     {formData.fields.length === 0 && (
//                                         <div className="text-center py-12 text-gray-500">
//                                             <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
//                                             <p className="text-lg">No fields yet</p>
//                                             <p className="text-sm">Add fields from the sidebar to get started</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Field Editor */}
//                         <div className="col-span-3">
//                             {selectedField ? (
//                                 <FieldEditor field={formData.fields.find(f => f.id === selectedField)!} />
//                             ) : (
//                                 <div className="bg-white rounded-xl shadow-sm p-6">
//                                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Settings</h3>
//                                     <p className="text-gray-500">Select a field to edit its properties</p>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 {mode === 'preview' && (
//                     <div className="max-w-4xl mx-auto">
//                         <div className="bg-white rounded-xl shadow-sm p-8">
//                             <div className="mb-8 pb-6 border-b border-gray-200">
//                                 <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title}</h1>
//                                 <p className="text-gray-600">{formData.description}</p>
//                             </div>

//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 {formData.fields.map((field) => (
//                                     <div key={field.id}>
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             {field.label}
//                                             {field.required && <span className="text-red-500 ml-1">*</span>}
//                                         </label>
//                                         {field.description && (
//                                             <p className="text-sm text-gray-600 mb-3">{field.description}</p>
//                                         )}
//                                         {renderFormField(field, true)}
//                                     </div>
//                                 ))}

//                                 <div className="pt-6">
//                                     <button
//                                         type="submit"
//                                         className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg"
//                                     >
//                                         Submit Form
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     </div>
//                 )}

//                 {mode === 'submissions' && (
//                     <div className="bg-white rounded-xl shadow-sm p-8">
//                         <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Submissions</h2>
//                         {submissions.length === 0 ? (
//                             <div className="text-center py-12 text-gray-500">
//                                 <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
//                                 <p className="text-lg">No submissions yet</p>
//                                 <p className="text-sm">Submissions will appear here once users fill out your form</p>
//                             </div>
//                         ) : (
//                             <div className="overflow-x-auto">
//                                 <table className="w-full border-collapse border border-gray-300">
//                                     <thead>
//                                         <tr className="bg-gray-50">
//                                             <th className="border border-gray-300 px-4 py-2 text-left">Submitted At</th>
//                                             {formData.fields.map((field) => (
//                                                 <th key={field.id} className="border border-gray-300 px-4 py-2 text-left">
//                                                     {field.label}
//                                                 </th>
//                                             ))}
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {submissions.map((submission, idx) => (
//                                             <tr key={idx} className="hover:bg-gray-50">
//                                                 <td className="border border-gray-300 px-4 py-2">
//                                                     {new Date(submission.submittedAt).toLocaleString()}
//                                                 </td>
//                                                 {formData.fields.map((field) => (
//                                                     <td key={field.id} className="border border-gray-300 px-4 py-2">
//                                                         {Array.isArray(submission[field.id])
//                                                             ? submission[field.id].join(', ')
//                                                             : submission[field.id] || '-'}
//                                                     </td>
//                                                 ))}
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default AdvancedFormBuilder;