import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import InpageNavigation from "../components/inpage-navigation.component"
import { useEffect, useState } from "react"
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component"
import MinimalBlogPost from "../components/nobanner-blog-post.component"
import { activeTabRef } from "../components/inpage-navigation.component"
import NoDataMessage from "../components/nodata.component"
import { FilterPaginationData } from "../common/filter-pagination-data"
import LoadMoreDataBtn from "../components/load-more.component"

const HomePage = () => {

    let [blogs, setBlog] = useState(null)
    let [trendingBlogs, setTrendingBlog] = useState(null)

    let [pagState, setPageState] = useState("home")
    let categories = ["programming", "hollywood", "social media", "sports", "film making", "healthcare", "cooking", " tech", "finances", "travel"]


    const fetchLatestBlogs = ( {page = 1} ) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs",{ page })
            .then(async({ data }) => {

                //console.log(data.blogs);

                let formatData = await FilterPaginationData({
                    state: blogs, 
                    data: data.blogs,
                    page,
                    countRoute: "/all-latest-blogs-count"
                })

                setBlog(formatData);
            })
            .catch(err => {
                console.log(err);
            })
    }

    const fetchTrendingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
            .then(({ data }) => {
                setTrendingBlog(data.blogs);
            })
            .catch(err => {
                console.log(err);
            })
    }

    const fetchBlogsByCategory = ({ page = 1}) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", { tag: pagState, page })
            .then(async({ data }) => {
                let formatData = await FilterPaginationData({
                    state: blogs, 
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { tag: pagState }
                })

                setBlog(formatData);
            })
            .catch(err => {
                console.log(err);
            })

    }

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase()
        setBlog(null)
        console.log('clicked');

        if (pagState == category) {
            setPageState("home")
            return;
        }
        setPageState(category)
    }


    useEffect(() => {
        activeTabRef.current.click()
        if (setPageState == "home") {
            fetchLatestBlogs({ page : 1 })
        } else {
            fetchBlogsByCategory( { page : 1 } )

        }

        if (!trendingBlogs) {
            fetchTrendingBlogs()

        }
    }, [pagState])


    return (
        <AnimationWrapper>

            <section className="h-cover flex justify-center gap-10 ">
                <div className="w-full">
                    <InpageNavigation routes={[pagState, "trending blogs"]} defaultHidden={["trending blogs"]}>

                        <>

                            {blogs == null ? (<Loader />) : (
                                //results
                                blogs.length ?       
                                    blogs.map((blog, i) => {
                                        return (<AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                            <BlogPostCard />
                                        </AnimationWrapper>
                                        )
                                    })
                                    : <NoDataMessage message="No Blogs Published" />
                            )}

                            <LoadMoreDataBtn state={blogs} fetchDataFun={(pagState == "home" ? fetchLatestBlogs :fetchBlogsByCategory)}/>

                        </>

                            {trendingBlogs == null ? (<Loader />) : (
                                trendingBlogs.length ?
                                    trendingBlogs.map((blog, i) => {
                                        return (<AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </AnimationWrapper>
                                        )
                                    })
                                    : <NoDataMessage message="No Trending Blogs" />
                            )}


                    </InpageNavigation>
                </div>

                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all Interest</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return <button onClick={loadBlogByCategory} className={"tag " + (pagState == category ? " bg-black text-white " : " ")} key={i}>
                                            {category}
                                        </button>
                                    })

                                }

                            </div>
                        </div>


                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending<i className="fi fi-rr-arrow-trend-up"></i> </h1>
                            {
                                trendingBlogs == null ? (<Loader/>) : (
                                    trendingBlogs.length ?
                                    trendingBlogs.map((blog, i) => {
                                    return( <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                        <MinimalBlogPost blog={blog} index={i} />
                                    </AnimationWrapper>
                                    )
                                })
                                : <NoDataMessage message="No Trending Blogs" />
                            )}
                        </div>
                    </div>
                </div>

            </section>
        </AnimationWrapper>
    )
}

export default HomePage