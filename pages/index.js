
import BigNumber from 'bignumber.js'
import { useContext, useEffect, useState } from 'react'
import { MainContext } from '../context'
import lit from '../services/lit'

export default function Home() {
  const [data, setData] = useState()
  const [URI, setURI] = useState()
  const [amount, setAmount] = useState([])
  const [encryptedFields, setEncryptedFields] = useState()
  const [decryptedFields, setDecryptedFields] = useState()
  // const [encryptedFile, setEncryptedFile] = useState(null);
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState(null);
  const { bundlrInstance, initialiseBundlr, balance, fetchBalance } = useContext(MainContext)
  const url = "https://zasle4jly64xxkxqml3saafjkgqtufi36lecmq2fzdkl6vt4nauq.arweave.net/yCSycSvHuXuq8GL3IACpUaE6FRvyyCZDRcjUv1Z8aCk"


  async function initialize() {
    initialiseBundlr()
  }
  async function fetchData(e) {
    e.preventDefault()
    let fields = []

    let response = await fetch(url).then(res => res.json());
    console.log(response);
    const localObject = response?.metadata

    await Promise.all(Object?.keys(localObject).map(async (key) => {

      const encrypted = await handleFieldEncryption(String(localObject[key]))
      console.log(e)
      fields.push({ key, encryptedFile: await blobToDataURI(encrypted?.encryptedFile), encryptedSymmetricKey: encrypted?.encryptedSymmetricKey })
    }))

    setEncryptedFields(fields)
  }

  // async function uploadFile() {
  //   if (!encryptedFile) return null;
  //   console.log('before encryption', encryptedFile)
  //   const stringToUpload = await blobToDataURI(encryptedFile);
  //   console.log(stringToUpload);
  //   let tx = await bundlrInstance.uploader.upload(stringToUpload, [{ name: "Content-Type", value: "text/plain" }])
  //   setURI(`http://arweave.net/${tx.data.id}`);
  //   console.log(URI)
  // }

  async function uploadFile() {
    if (!encryptedFields) return null;
    console.log('before encryption', encryptedFields)
    const stringToUpload = JSON.stringify(encryptedFields)
    console.log(stringToUpload);
    let tx = await bundlrInstance.uploader.upload(stringToUpload, [{ name: "Content-Type", value: "text/plain" }])
    setURI(`http://arweave.net/${tx.data.id}`);
  }

  const blobToDataURI = (blob) => {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();

      reader.onload = (e) => {
        var data = e.target.result;
        resolve(data);
      };
      reader.readAsDataURL(blob);
    });
  }


  const dataURItoBlob = (dataURI) => {

    console.log(dataURI);


    var byteString = window.atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    var blob = new Blob([ab], { type: mimeString });

    return blob;
  }

  // async function onFetchEncryptedData() {
  //   try {
  //     const response = await fetch(URI);
  //     let fetchdata = await response.text();
  //     fetchdata = dataURItoBlob(fetchdata);
  //     console.log('before decryption', fetchData)
  //     setEncryptedFile(fetchdata)
  //     console.log(fetchdata)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  async function fundWallet() {
    if (!amount) return
    const amountParsed = parseInput(amount)
    let response = await bundlrInstance.fund(amountParsed)
    console.log('Wallet funded: ', response)
    fetchBalance()
  }

  function parseInput(input) {
    const conv = new BigNumber(input).multipliedBy(bundlrInstance.currencyConfig.base[1])
    if (conv.isLessThan(1)) {
      console.log('error: value too small')
      return
    } else {
      return conv
    }
  }

  async function handleFieldEncryption(value) {
    if (!value) return;
    try {
      const encrypted = await lit.encryptString(value);
      return encrypted
    } catch (err) {
      console.log(err)
    }
  }



  // async function handleEncryption(e) {
  //   e.preventDefault();
  //   if (!data) return;
  //   try {
  //     console.log(data);
  //     const encrypted = await lit.encryptString(data);
  //     setEncryptedFile(encrypted?.encryptedFile);
  //     setEncryptedSymmetricKey(encrypted?.encryptedSymmetricKey);
  //     // console.log(encrypted.encryptedFile)
  //     // console.log(encrypted.encryptedSymmetricKey)
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }


  // async function handleDecryption(e) {
  //   e.preventDefault();
  //   // fetch from the areve network
  //   // decypt using lifi protocol
  //   if (!encryptedFile) return;
  //   try {
  //     console.log(encryptedFile);
  //     const decrypted = await lit.decryptString(encryptedFile, encryptedSymmetricKey);
  //     console.log(decrypted);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async function handleDecryption(e) {
    console.log(URI)
    e.preventDefault();
    let dfields = []
    // fetch from arweve network
    let response = await fetch(URI).then(res => res.json());
    console.log(response);
    // filter out each keys and run decryptfunction on it 
    await Promise.all(response.map(async ele => {

      let encryptedFile = dataURItoBlob(ele?.encryptedFile)
      const decrypted = await lit.decryptString(encryptedFile, ele.encryptedSymmetricKey);
      dfields.push({ key: ele.key, decryptedFile: decrypted.decryptedFile })
    }))
    // console.log or either show the data on DOM 

    setDecryptedFields(dfields)
  }

  return (
    <div style={containerStyle}>
      {
        !balance && <button onClick={initialize}>Initialize</button>
      }
      {
        balance && (
          <div>
            <h3>Balance: {balance}</h3>
            <div style={{ padding: '20px 0px' }}>
              <input onChange={e => setAmount(e.target.value)} />
              <button onClick={fundWallet}>Fund Wallet</button>
            </div>
            <button onClick={fetchData}>Only Fetch Data</button>
            {/* <button
              onClick={handleEncryption}
            >Fetch Data for Encryption</button> */}
            <button onClick={uploadFile}>Upload File to Arweave</button>
            {/* <button onClick={onFetchEncryptedData}>Fetch File from Arweave</button> */}
            <button onClick={handleDecryption}>Decrypt file from Arweave</button>
            {
              URI && <a href={URI}>{URI}</a>
            }

          </div>
        )
      }

      <div>
        {
          encryptedFields && encryptedFields?.map(ele => {
            return (
              <div>
                <p>{ele?.key}</p>

                <span>{ele?.encryptedFile}</span>
              </div>
            )
          })
        }
      </div>

      <div>
        <h1>After Decryption</h1>
        {
          decryptedFields && decryptedFields.map(ele => {
            console.log(ele)
            return (
              <div>
                <p>{ele.key}</p>
                <span>{ele.decryptedFile}</span>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

const containerStyle = {
  padding: '100px 20px'
}