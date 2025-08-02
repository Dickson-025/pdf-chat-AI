import { useRef, useCallback, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import upload from "../../assets/uploadbtn.svg";
import "./Uploadpdf.css";
import axios from 'axios';
// import { useNavigate } from "react-router-dom";

const Uploadpdf = ({SetUploadFile}) => {
  const uploadfile = useRef(null);
  const [uploadflag, setUploadflag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState('');
  const url = 'http://localhost:4000/';
  // const navigate = useNavigate()
    
  const uploadCardClick = () => {
    uploadfile.current.click();
  }

  const onDrop = useCallback(acceptedFiles => {
    console.log('input', acceptedFiles);
    ;(async ()=>{
      const formdata = new FormData;
      formdata.append('file', acceptedFiles[0]);
      formdata.append('filename', acceptedFiles[0].name);
      try {
        setUploadflag(true);
        let res = await axios.post(url + 'api/upload', formdata, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          console.log('percent', event.loaded, event.total);
          
          setProgress(percent);
        },
        });
        console.log('response', res);
        if(res.status == 200) {
          console.log('here');
          localStorage.setItem('file', acceptedFiles[0])
          SetUploadFile(acceptedFiles[0]);
          localStorage.setItem('id', res.data.data.id);
          setFile('');
          // return navigate('/pdfchat')
        }
      } catch (error) {
        console.log('error', error);
      } finally {
        setTimeout(() => {
          setUploadflag(false); 
          setProgress(0);
        }, 3000);
      }
    })()
  });

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    < >
      { !uploadflag 
        ? <div className='card-upload' onClick= { uploadCardClick } {...getRootProps()}>
            <input 
              type="file" 
              ref = { uploadfile } 
              hidden 
              value = { file }
              accept="application/pdf" 
              onChange={e => setFile(e.target.files[0])} 
              {...getInputProps()}
            />
            <img src={upload} className="upload" alt="Upload Icon"/>
            <div className='upload-title'>Upload PDF to start chatting</div>
            {
              isDragActive ? 
              <div className='upload-subtitle'>Drag and drop your file here ...</div> : 
              <div className='upload-subtitle'>Click or drag and drop your file here</div>
            }
          </div>
        : <>
          <div className='loader-card'>
            <div className='d-flex'>
              <div className='circle-loader'></div> 
              <div className='d-flex content-between w-100'> 
                <p className='upload-title'>Uploading File</p> 
                <div className='upload-title'>{progress} %</div></div>
            </div>
            {/* <div className='linear-loader'></div> */}
            <div className="linear-loader">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </>
      }
    </>
  )
}

export default Uploadpdf