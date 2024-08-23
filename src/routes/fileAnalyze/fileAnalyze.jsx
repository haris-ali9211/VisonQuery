import "./fileAnalyze.css";
import {useRef, useState} from "react";
import Markdown from 'marked-react';
import {useMutation} from "@tanstack/react-query";

const FileAnalyze = () => {
    const [showUpload, setShowUpload] = useState(true);
    const [isLoading, setisLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [answer, setAnswer] = useState(""); // Placeholder for Markdown rendering
    const fileInputRef = useRef(null);

    const mutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("question", "Explain give income statement in detail and in tabular form");
            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze-image/`, {
                method: "POST", body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to analyze image");
            }

            return response.json();
        }, onSuccess: (responseAnswer) => {
            console.log(responseAnswer);
            setAnswer(responseAnswer.answer);
            setisLoading(false);
        }, onError: (err) => {
            console.log(err);
            setisLoading(false);
        },
    });

    const onUploadFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                // Handle image preview
                setPreview(URL.createObjectURL(file));
                setisLoading(true);
                mutation.mutate();
            } else {
                // Handle non-image file preview or processing
                // Here you can add logic to process other file types like PDF, DOC, etc.
            }

            setShowUpload(false); // Hide the upload card once a file is selected
        }
    };

    return (
        <div className="upload">
            <div className="center">
                <h1>Financial Statement Analyzer</h1>
                <div className="container">
                    {showUpload &&
                        <div className="card">
                            <h3>Upload Files</h3>
                            <div className="drop_box">
                                <header>
                                    <h4>Select File here</h4>
                                </header>
                                <p>Files Supported: PDF, TEXT, DOC, DOCX, JPG, PNG</p>
                                <input
                                    type="file"
                                    hidden
                                    accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.gif"
                                    id="fileID"
                                    ref={fileInputRef}
                                    onChange={onUploadFile}
                                />
                                <button className="btn" onClick={() => fileInputRef.current.click()}>
                                    Choose File
                                </button>
                            </div>
                        </div>
                    }

                    {!showUpload &&
                        <div className="report">
                            {preview && (
                                <div className="imageUpload">
                                    {preview && <img
                                        src={preview}
                                        alt="uploadImage"
                                        width="380"
                                        height="380"
                                    />}
                                </div>
                            )}

                            {(!showUpload && !isLoading) && <div className="isReport">
                                <Markdown>{answer}</Markdown>
                            </div>}

                            {setisLoading && <div
                                // style={{backgroundColor: "#2c2937", borderRadius: "20px", maxWidth: "40%"}}
                            >
                                <div className="loader"/>
                            </div>}



                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default FileAnalyze;
