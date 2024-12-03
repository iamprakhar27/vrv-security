

import Navbar from "./components/navbar.component";
import { Routes, Route, Navigate } from "react-router-dom";
import UserAuthForm from "./pages/userAuthForm.page";
import { useState, createContext, useEffect } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages"
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import AdminAuthForm from "./pages/adminAuthForm";
import AdminDashboard from "./components/admin.Dashboard.component";

export const UserContext = createContext({})
export const AdminContext = createContext({})

const App = () => {
    const [userAuth, setUserAuth] = useState({})
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        let userInSession = lookInSession("user")
        const adminInSession = lookInSession("admin");
        userInSession
            ? setUserAuth(JSON.parse(userInSession))
            : setUserAuth({ access_token: null })

        adminInSession
            ? setIsAdmin(true)
            : setIsAdmin(false)
    }, [])

    return (
        <>
            <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
                <Routes>
                    <Route path="/admin-login" element={<AdminAuthForm type="sign-in" />} />
                    <Route path="/admin-signup" element={<AdminAuthForm type="sign-up" />} />
                    <Route
                        path="/admin-dashboard"
                        element={isAdmin ? <AdminDashboard/> : <Navigate to="/admin-login" />}
                    />
                </Routes>
            </AdminContext.Provider>

            <UserContext.Provider value={{ userAuth, setUserAuth }}>
                <Routes>
                    <Route path="/editor" element={<Editor />} />
                    <Route path="/" element={<Navbar />}>
                        <Route index element={<HomePage />} />
                        <Route path="/signin" element={<UserAuthForm type="sign-in" />} />
                        <Route path="/signup" element={<UserAuthForm type="sign-up" />} />
                        <Route path="search/:query" element={<SearchPage />} />
                        <Route path="user/:id" element={<ProfilePage />} />
                        <Route path="blog/:blog_id" element={<BlogPage />} />
                        <Route path="*" element={<PageNotFound />} />
                    </Route>
                </Routes>
            </UserContext.Provider >
        </>

    )
}

export default App;