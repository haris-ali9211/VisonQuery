import {useEffect, useRef, useState} from "react";
import "./newPrompt.css";
import Markdown from 'marked-react';
import {useMutation} from "@tanstack/react-query";

const NewPrompt = () => {
    const [messages, setMessages] = useState([]);
    const [preview, setPreview] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setisLoading] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const mutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("question", messages[messages.length - 1]?.text);
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
            setMessages((prevMessages) => [...prevMessages, {type: 'response', text: responseAnswer.answer},]);
            setisLoading(false);
        }, onError: (err) => {
            console.log(err);
            setisLoading(false);
        },
    });

    const addMessage = async (userInput) => {
        setMessages((prevMessages) => [...prevMessages, {type: 'user', text: userInput},]);
        setisLoading(true);
        mutation.mutate();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        addMessage(inputValue);
        setInputValue("");
    };

    const onUploadFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleInput = (e) => {
        setInputValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.2)}px`;
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.5)}px`;
        }
    }, []);

    return (<>
            {preview && (<img
                    src={preview}
                    alt="uploadImage"
                    width="380"
                    height="380"
                />)}
            {messages.map((message, index) => (<div key={index} className={`message ${message.type}`}>
                    <Markdown>{message.text}</Markdown>
                </div>))}

            {isLoading && <div className={`message`}
                               // style={{backgroundColor: "#2c2937", borderRadius: "20px", maxWidth: "40%"}}
            >
                <div className="wait"/>
            </div>}

            <div className="endChat"
                // ref={endRef}
            ></div>
            <form className="newForm" onSubmit={handleSubmit}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUploadFile}
                    hidden
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                >
                    <img src="/attachment.png" alt="Upload"/>
                </button>
                <textarea
                    ref={textareaRef}
                    placeholder="Ask anything..."
                    onInput={handleInput}
                    style={{overflowY: 'auto', resize: "none"}}
                    value={inputValue}
                ></textarea>
                <button type="submit" disabled={isLoading}>
                    <img src="/arrow.png" alt="Submit"/>
                </button>
            </form>
        </>);
};

export default NewPrompt;
