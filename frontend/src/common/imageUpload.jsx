import axios from "axios";

export const uploadImage = async (img) =>{
  let imgUrl = null
  await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/upload-url")
   .then( async ({ data: {uploadURL} }) =>{
      await axios({
         method: "POST",
          url: uploadURL,
            headers: { 'content-type': 'multipart/form-data'},
            data: img 
     })
       .then(() =>{
          imgUrl = uploadURL.split("?")[0] 
        })
  })  
   return imgUrl
}