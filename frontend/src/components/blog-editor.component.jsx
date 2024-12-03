import { Link, useNavigate } from "react-router-dom"
import logo from "../imgs/logo.png"
import AnimationWrapper from "../common/page-animation"
import defaultBanner from "../imgs/blog banner.png"
import { useContext, useEffect, useRef, useState } from "react"
import { EditorContext } from "../pages/editor.pages"
import EditorJs from "@editorjs/editorjs"
import { tools } from "./tools.component"
import { Toaster, toast } from "react-hot-toast"
import { uploadImage } from "../common/imageUpload"
import axios from "axios"
import { UserContext } from "../App"



const BlogEditor = () => {

    const { blog, blog: { title, banner, content, tags, des }, setBlog, textEditor, setTextEditor, setEditorState } = useContext(EditorContext)

    let blogBannerRef = useRef()
    let navigate = useNavigate()
    let { userAuth: { access_token } } = useContext(UserContext)


    useEffect(() => {
        if (!textEditor.isReady) {
            setTextEditor(new EditorJs({
                holderId: "textEditor",
                data: content,
                tools: tools,
                placeholder: "Share your story"

            }))

        }

    }, [])

    const handleBannerUpload = async (e) => {
        const img = e.target.files[0];

        if (img) {
            let loadingToast = toast.loading("Uploading...")
            uploadImage(img).then((url) => {
                if (url) {
                    toast.dismiss(loadingToast)
                    toast.success("uploaded ")

                    blogBannerRef.current.src = url

                }
            })
                .catch(err => {
                    toast.dismiss(loadingToast)
                    return toast.error(err)
                })
        }

    };

    const handleTitleKeyDown = (e) => {
        console.log(e);
        if (e.keyCode === 32) {
            e.preventDefault()
        }
    }
    const handleTitleChange = (e) => {
        const input = e.target

        input.style.height = 'auto'
        input.style.height = input.scrollHeight + "px"

        setBlog({ ...blog, title: input.value })

    }

    const handlePublishEvent = () => {
        // if (!banner.length) {
        //     return toast.error("Upload a blog banner to publish it");
        // }
        if (!title || !title.length) {
            return toast.error("Write a blog title to publish it");
        }
        if (textEditor.isReady) {
            textEditor.save().then(data => {
                if (data.blocks.length) {
                    setBlog({ ...blog, content: data })
                    setEditorState("publish")
                } else {
                    return toast.error("write in your blog to publish it")
                }
            })
                .catch((err) => {
                    console.log(err);
                })
        }
        setEditorState("publish");


    }

    const handleSaveDraft = (e) => {

        if (e.target.className.includes('disable')) {
            return
        }

        if (!title.length) {
            return toast.error("Add title before saving it as draft")
        }


        let loadingToast = toast.loading("Saving Draft......")
        e.target.classList.add('disable')

        if (textEditor.isReady) {
            textEditor.save().then(content => {

                let blogObj = {
                    title, banner, tags, des, content, draft: true
                }

                axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", blogObj, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                })
                    .then(() => {
                        e.target.classList.remove('disable')

                        toast.dismiss(loadingToast)
                        toast.success("saved")

                        setTimeout(() => {
                            navigate("/")

                        }, 500)

                    })
                    .catch(({ response }) => {
                        e.target.classList.remove('disable')
                        toast.dismiss(loadingToast)

                        return toast.error(response.data.error)


                    })

            })
        }


    }

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} alt="" />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    {title.length ? title : "New Blog"}
                </p>

                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2" onClick={handlePublishEvent} >
                        Publish
                    </button>
                    <button className="btn-light py-2" onClick={handleSaveDraft}>
                        Save Draft
                    </button>
                </div>
            </nav>
            <Toaster />
            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                            <label htmlFor="uploadBanner">
                                <img src={defaultBanner} ref={blogBannerRef} alt="Banner" className="z-20 w-full h-full object-cover" />
                                <input
                                    type="file"
                                    id="uploadBanner"
                                    accept=".png, .jpg, .jpeg"
                                    hidden
                                    onChange={handleBannerUpload}
                                />
                            </label>
                        </div>

                        <textarea
                            placeholder="Blog title"
                            className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                            defaultValue={title}
                        >
                        </textarea>
                        <hr className="w-full opacity-10 my-5" />

                        <div id="textEditor" className="font-gelasio">

                        </div>

                    </div>
                </section>
            </AnimationWrapper>
        </>
    )

}
export default BlogEditor