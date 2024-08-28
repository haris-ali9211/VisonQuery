import "./fileAnalyze.css";
import { useRef, useState } from "react";
import Markdown from 'marked-react';
import { useMutation } from "@tanstack/react-query";
import DocViewer from "react-doc-viewer";
import mammoth from "mammoth";
import html2pdf from 'html2pdf.js';  // Assuming you use html2pdf.js for conversion to PDF

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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze-file/`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to analyze file");
            }

            return response.json();
        },
        onSuccess: (responseAnswer) => {
            console.log(responseAnswer);
            setAnswer(responseAnswer.answer);
            setisLoading(false);
        },
        onError: (err) => {
            console.log(err);
            setisLoading(false);
        },
    });

    const onUploadFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();

            reader.onloadend = async () => {
                let base64String = reader.result;

                if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    try {
                        // Convert DOCX to HTML
                        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: reader.result });

                        // Convert HTML to PDF using html2pdf.js
                        const pdfBlob = await html2pdf().from(html).outputPdf('blob');

                        // Create a base64 string from the PDF Blob
                        const pdfReader = new FileReader();
                        pdfReader.onloadend = () => {
                            base64String = pdfReader.result;
                            setPreview(base64String);
                            setisLoading(true);
                            mutation.mutate();
                        };
                        pdfReader.readAsDataURL(pdfBlob);
                    } catch (error) {
                        console.error("Error converting DOCX to PDF", error);
                        setisLoading(false);
                    }
                } else {
                    setPreview(base64String);
                    setisLoading(true);
                    mutation.mutate();
                }
            };

            if (file.type.startsWith('image') || file.type === 'application/pdf') {
                reader.readAsDataURL(file); // Correctly read as DataURL for images and PDFs
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                reader.readAsArrayBuffer(file); // Read as ArrayBuffer for mammoth processing
            } else if (file.type === 'application/msword') {
                alert("DOC format is not supported for conversion.");
                setisLoading(false);
            }

            setShowUpload(false);
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
                                <div>
                                    {selectedFile.type.startsWith('image') && (
                                        <img
                                            src={preview}
                                            alt="uploadImage"
                                        />
                                    )}
                                    {selectedFile.type === 'application/pdf' && (
                                        <iframe
                                            className="pdf-viewer"
                                            width="70%"
                                            height="460px"
                                            src={`data:application/pdf;base64,${preview.split(',')[1]}`}
                                        >
                                        </iframe>
                                    )}
                                    {(selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.type === 'application/msword') && preview && (
                                        <iframe
                                            className="pdf-viewer"
                                            width="70%"
                                            height="460px"
                                            src={`data:application/pdf;base64,${preview.split(',')[1]}`}
                                        >
                                        </iframe>
                                    )}
                                </div>
                            )}

                            {(!showUpload && !isLoading) && <div className="isReport">
                                <Markdown>{answer}</Markdown>
                            </div>}

                            {isLoading && (
                                <div className="loader"/>
                            )}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default FileAnalyze;
