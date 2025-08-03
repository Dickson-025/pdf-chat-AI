import './PdfPreview.css'
import Form from 'react-bootstrap/Form';
import arrow from '../../assets/arrow.png';
import usericon from '../../assets/user-icon.svg';
import responsebot from '../../assets/bot-icon.svg';
import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import axios from 'axios'
import ReactMarkdown from 'react-markdown';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default || workerUrl;


const PdfPreview = ({uploadfile, SetUploadFile}) => {
  const url = "https://pdf-chat-ai-oixn.onrender.com/";
  const [chatinput, setInput] = useState('');
  const [userchat, SetUserChat] = useState([]);
  const [numPages, setNumPages] = useState(null);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const chatBoxRef = useRef(null);

  const id = localStorage.getItem('id')

  const handleSubmit = async () => {
    console.log('uploadfile', uploadfile);
    // if (!chatinput.trim()) return;

    const result = await axios.post(url + `api/ask/${id}`, {chatinput})

    if(result){
      let chat = {
        userchat: chatinput,
        userans: result.data.data.answer
      }
      SetUserChat(prev => [...prev, chat]);
      setInput('');
    }
  };

  const reuploadPdf = async () => {
    setShow(false);
    localStorage.removeItem('id');
    SetUploadFile(null);
  }

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [userchat]);

  return (
    <div className='d-flex pdf-preview-parent'>
      <div className='w-50'>
        <div className='chat-box' ref= {chatBoxRef}>
          <div className='ready-desc'>
            <h4>Your document is ready!</h4>
            <p>You can now ask questions about your document. For example:</p>
            <p>
              <li>"What is the main topic of this document?"</li>
              <li>"Can you summarize the key points?"</li>
              <li>"What are the conclusions or recommendations?"</li>
            </p>


          </div>
          {userchat.map((chat, index) => (
            <div className='p-2' key={index}>
              <div className='userchat d-flex'>
                <img className='me-2' src={ usericon } width={ '20px' } alt="usericon" />
                <div>
                  {chat.userchat}
                </div>
              </div>
              <div className='userresponse d-flex'>
                <img className='me-2' src={ responsebot } width={'20px'} alt="response" />
                <div>
                  <ReactMarkdown >{chat.userans}</ReactMarkdown >
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className='d-flex'>
          <Form.Control
            type='text'
            placeholder='Ask about the document...'
            value={chatinput}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <img
            src={arrow}
            width='10%'
            alt='Send'
            onClick={handleSubmit}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>
      <div className='w-50 pdf-container'>
        <Button variant="outline-primary" className='d-flex m-1' onClick={handleShow}>Re-Upload PDF</Button>
        {uploadfile && (
          <Document
            file={uploadfile}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<p>Loading PDF...</p>}
          >
            {Array.from({ length: numPages || 0 }, (_, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false}/>
            ))}
          </Document>
        )}

        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Re-Upload PDF</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to re upload pdf ?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              No
            </Button>
            <Button variant="primary" onClick={reuploadPdf}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default PdfPreview;
