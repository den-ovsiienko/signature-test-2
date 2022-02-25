import logo from './logo.svg';
import './App.css';
import { Document, Page } from 'react-pdf/dist/esm/entry.parcel2';
import { useEffect, useRef, useState } from 'react';
import pdf from './Cover_letter_safe_software.pdf'
import { PDFDocument } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas'
import download from 'downloadjs';

function App() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pad, setPod] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [chosenIndex, setChosenIndex] = useState(-1);
  const [coordinates, setCoordinates] = useState({
    x: 0,
    y: 0
  });
  const [displayedSize, setDisplayedSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [signatureSize, setSignatureSize] = useState({
    width: 100,
    height: 60
  })
  const [file, setFile] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if(file == null) return;
    const getFileParams = async () => {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const page = pdfDoc.getPage(0);
      setOriginalSize({width: page.getWidth(), height: page.getHeight()})
    }
    getFileParams();
  }, [file])

  const onDocumentLoadSuccess = async (pdf) => {
    const page = await pdf.getPage(1);
    console.log(page.width);
    console.log(page.height);
    setNumPages(pdf.numPages);
  }

  const createPdfDoc = async () => {
    //Populate signatures
    let fileBytes = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(fileBytes);
    const page = pdfDoc.getPage(0);
    const form = pdfDoc.getForm();
    const signatureField = form.createButton('dmf.signature');
    signatures.forEach((item) => {
      signatureField.addToPage('', page, {x: item.x, y: page.getHeight() - item.y - item.height / 1.5, width: item.width, height: item.height});
    })

    const pdfBytes1 = await pdfDoc.save();
    download(pdfBytes1, 'testFile.pdf', 'application/pdf');

    // Fill signatures
    const newSignatureField = form.getButton('dmf.signature');
    const imgBytes = await dataURItoBlob(pad.getTrimmedCanvas().toDataURL('image/png')).arrayBuffer();
    const signImage = await pdfDoc.embedPng(imgBytes);
    newSignatureField.acroField.getWidgets().forEach((item) => {
      let rect = item.getRectangle();
      let newHeight = rect.width / signImage.width * signImage.height;
      page.drawImage(signImage, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: newHeight,
      }) 
    })
    form.removeField(newSignatureField)
    const pdfBytes2 = await pdfDoc.save();
    download(pdfBytes2, 'testFile.pdf', 'application/pdf');
  }


  function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);
  
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
  
    // create a view into the buffer
    var ia = new Uint8Array(ab);
  
    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
  
    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  
  }

  const addSignature = () => {
    setSignatures([...signatures, {
      x: 0,
      y: 0,
      height: 80,
      width: 100
    }])
  }

  console.log('Size(react-pdf):', displayedSize)
  console.log('Size(pdf-lib):', originalSize)
  console.log('Coordinates:', coordinates)
  console.log(signatures);

  return (
    <>
    <button onClick={addSignature}>Add Signature</button>
    <div onClick={(e) => chosenIndex != -1 ? setSignatures(signatures.map((item, i) => {
      if(i === chosenIndex) {
        return {...item, x: e.clientX + document.documentElement.scrollLeft, y: e.clientY + document.documentElement.scrollTop}
      }
      return item
    })) : null}>
      <Document onLoadSuccess={onDocumentLoadSuccess} file={file}>
        <Page onLoadSuccess={(page) => setDisplayedSize({width: page.width, height: page.height})} ref={ref}  pageNumber={pageNumber} />
      </Document>
      </div>
      <p>
        Page {pageNumber} of {numPages}
      </p>
      <div>
      <SignatureCanvas penColor='green' ref={(ref) => setPod(ref)}
    canvasProps={{width: 500, height: 200}} />
      </div>
      <div>
      <button onClick={() => setPageNumber(pageNumber - 1)}>Previous Page</button>
      <button onClick={() => setPageNumber(pageNumber + 1)}>Next Page</button>
      </div>
      <div>
        <input onChange={(e) => setFile(e.target.files[0])} type='file' />
        <button onClick={createPdfDoc}>Sign file</button>
      </div>
      {signatures.map((item, i) => {
        return (
          <div key={i} onClick={() => setChosenIndex(i)} style={{background: chosenIndex === i ? 'red' : 'blue', width: item.width, height: item.height, position: 'absolute', top: `${item.y}px`, left: `${item.x}px`}} />
        )
      })}
    </>
  );
}

export default App;
