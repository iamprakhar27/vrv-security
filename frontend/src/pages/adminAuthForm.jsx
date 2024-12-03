import { useContext } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { Navigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { AdminContext } from "../App";

const AdminAuthForm = ({ type }) => {
    const { adminAuth, setAdminAuth } = useContext(AdminContext);
    const access_token = adminAuth?.access_token;

    const adminAuthThroughServer = (serverRoute, formdata) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formdata)
            .then(({ data }) => {
                sessionStorage.setItem("admin", JSON.stringify(data));
                setAdminAuth(data);
            })
            .catch(({ response }) => {
                toast.error(response?.data?.error || "Authentication failed");
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const serverRoute = type === "sign-in" ? "/admin/signin" : "/admin/signup";

        const formdata = Object.fromEntries(new FormData(e.target));
        const { email, password } = formdata;

        if (!email || !password) {
            return toast.error("All fields are required");
        }

        adminAuthThroughServer(serverRoute, formdata);
    };

    return (
        access_token ? <Navigate to="/admin/dashboard" /> :
            <AnimationWrapper keyValue={type}>
                <section className="h-cover flex items-center justify-center">
                    <Toaster />
                    <form onSubmit={handleSubmit} className="w-[80%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                            {type === "sign-in" ? "Admin Login" : "Admin Registration"}
                        </h1>
                        <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope" />
                        <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key" />
                        <button className="btn-dark center mt-14" type="submit">
                            {type.replace("-", " ")}
                        </button>
                    </form>
                </section>
            </AnimationWrapper>
    );
};

export default AdminAuthForm;
