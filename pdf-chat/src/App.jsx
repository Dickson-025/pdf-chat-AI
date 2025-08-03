import { useState, useEffect } from 'react';
import Uploadpdf from './components/Upload-Page/Uploadpdf.jsx';
import PdfPreview from './components/pdfPreview/PdfPreview.jsx';
import axios from 'axios';
// import {RouterProvider, createBrowserRouter} from 'react-router-dom'

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <Uploadpdf />
//   },
//   {
//     path: '/pdfchat',
//     element: <PdfPreview />
//   }
// ])

function App() {
  // const [parentfile, SetParentFile] = useState(null);
  const [uploadfile, SetUploadFile] = useState(null);
  const url = "https://pdf-chat-ai-oixn.onrender.com/";
  // const [previewfile, SetPreviewFile] = useState(null);
  console.log('22', uploadfile);
  
  useEffect(() => {
    const id = localStorage.getItem('id');
    if (id) {
      axios.get(url + `api/files/${id}`, {
        responseType: 'blob',
      })
      .then(response => {
        console.log(response);
        
        // const name = response.headers['X-Filename'];

        // if (disposition && disposition.includes('filename=')) {
        //   const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        //   if (match && match[1]) {
        //     name = match[1].replace(/['"]/g, '');
        //   }
        // }
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileUrl = URL.createObjectURL(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Blob preview:', reader.result.slice(0, 20));
        };
        reader.readAsText(file);
        SetUploadFile(file);
        console.log('getFile', fileUrl);
      })
      .catch(error => {
        console.error('Error fetching file:', error);
        SetUploadFile(null);
      });
    }
  }, []);

  return (
    <>
      {
        ( !uploadfile ? <Uploadpdf SetUploadFile = { SetUploadFile }/> : <PdfPreview uploadfile={ uploadfile } SetUploadFile = { SetUploadFile }/>)
      }
      {/* <RouterProvider router={ router} ></RouterProvider> */}
    </>
  );
}

export default App
