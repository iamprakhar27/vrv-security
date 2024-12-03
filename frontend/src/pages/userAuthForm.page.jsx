import { useContext, useRef } from "react"
import AnimationWrapper from "../common/page-animation"
import InputBox from "../components/input.component"
import googleIcon from "../imgs/google.png"
import { Link, Navigate } from "react-router-dom"
import { Toaster, toast } from "react-hot-toast"
import axios from "axios"
import { storeInSession } from "../common/session"
import { UserContext } from "../App"
import { authWithGoogle } from "../common/firebase"


const UserAuthForm = ({ type }) => {

    const { userAuth, setUserAuth } = useContext(UserContext);
    const access_token = userAuth?.access_token; // Use optional chaining

    console.log(access_token);


    const userAuthThroughServer = (serverRoute, formdata) => {

        // console.log(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formdata);

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formdata)
            .then(({ data }) => {
                storeInSession("user", JSON.stringify(data))
                setUserAuth(data)
            })
            .catch(({ response }) => {
                toast.error(response.data.error)
            })

    }

    const handlesubmit = (e) => {
        e.preventDefault()

        const serverRoute = type == "sign-in" ? "/signin" : "/signup"

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        const form = new FormData(formElement)
        const formdata = {}

        for (let [key, value] of form.entries()) {
            formdata[key] = value
        }

        const { fullname, email, password } = formdata

        if (fullname) {
            if (fullname.length < 3) {
                return toast.error("full name must be 3 letters long")
            }
        }
        if (!email.length) {
            return toast.error("Enter email")
        }
        if (!emailRegex.test(email)) {
            return toast.error("email is  invalid")
        }
        if (!passwordRegex.test(password)) {
            return toast.error("password must be 6 to 20 characters long with a numeric, 1 lowercse and 1 uppercase ")
        }

        userAuthThroughServer(serverRoute, formdata)

    }

    const handleGoogleAuth = async (e) => {
        e.preventDefault();
        authWithGoogle().then(user => {
            let serverRoute = '/google-auth'
            let formdata = {
                access_token: user.accessToken
            }
            userAuthThroughServer(serverRoute, formdata);
        }).catch(err => {
            console.error("Error logging in through Google:", err);
            toast.error("Trouble logging in through Google");
        })
    };

    return (
        access_token ? <Navigate to="/" />
            :
            <AnimationWrapper keyValue={type}>
                <section className="h-cover flex items-center justify-center ">
                    <Toaster />
                    <form id="formElement" className="w-[80%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                            {type == "sign-in" ? "Welcome back" : "Join us today"}
                        </h1>

                        {
                            type !== "sign-in" ?
                                <InputBox
                                    name="fullname"
                                    type="text"
                                    placeholder="Full Name"
                                    icon="fi-rr-user"
                                />

                                : ""
                        }
                        <InputBox
                            name="email"
                            type="email"
                            placeholder="Email"
                            icon="fi-rr-envelope"
                        />

                        <InputBox
                            name="password"
                            type="password"
                            placeholder="Password"
                            icon="fi-rr-key"
                        />
                        <button
                            className="btn-dark center mt-14 "
                            type="submit"
                            onClick={handlesubmit}
                        >
                            {type.replace("-", " ")}
                        </button>
                        <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>or</p>
                            <hr className="w-1/2 border-black" />
                        </div>
                        <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                            <img src={googleIcon} alt="" className="w-5 " />
                            continue with google
                        </button>

                        {
                            type == "sign-in" ?
                                <p className="mt-6 text-dark-grey text-xl text-center">
                                    Don't have an account ?
                                    <Link to="/signup" className="underline text-black text-xl ml-1">
                                        Join us today
                                    </Link>

                                </p>
                                :
                                <p className="mt-6 text-dark-grey text-xl text-center">
                                    Already a member ?
                                    <Link to="/signin" className="underline text-black text-xl ml-1">
                                        Sign in here.
                                    </Link>

                                </p>

                        }
                    </form>

                </section>
            </AnimationWrapper>
    )
}

export default UserAuthForm