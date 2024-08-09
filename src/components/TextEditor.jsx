import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill stylesheet

function TextEditor() {
  const [editorContent, setEditorContent] = useState('');

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  return (
      <ReactQuill 
        onChange={handleEditorChange} 
        theme="snow" 
        placeholder="Compose your text here..." 
      />
  );
}

export default TextEditor;
