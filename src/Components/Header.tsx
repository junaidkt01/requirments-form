import "./components.scss"
import { signOut, auth } from "../firebase";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
    async function handleLogout() {
        await signOut(auth);
        window.location.href = "/login";
    }

    const user = useUser();
    const navigate = useNavigate();

    return (
        <div className="header_section" >
            <div>
                {/* <svg onClick={() => navigate('/')} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6325 7.11089L13.1591 3.08871C12.8049 2.86736 12.3957 2.75 11.9781 2.75C11.5604 2.75 11.1512 2.86736 10.797 3.08871L4.32368 7.13318C3.95561 7.36509 3.66347 7.69966 3.4833 8.09564C3.30313 8.49161 3.24281 8.93168 3.30978 9.36153L4.98105 19.3891C5.06886 19.9144 5.34188 20.3908 5.75065 20.7321C6.15942 21.0734 6.67691 21.2571 7.2094 21.2498H16.7913C17.3238 21.2571 17.8413 21.0734 18.2501 20.7321C18.6588 20.3908 18.9319 19.9144 19.0197 19.3891L20.6909 9.36153C20.7582 8.92366 20.6934 8.47568 20.5049 8.07479C20.3164 7.67391 20.0126 7.33833 19.6325 7.11089Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8.63554 16.4588H15.3206" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg> */}
                <img onClick={() => navigate('/')} className="header_logo" src="/black_logo.png" alt="" />
            </div>
            <div className="head_icons" >
                <div>
                    <svg onClick={() => navigate("/submissions")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.9218 12.0052V17.2864C19.919 17.7472 19.7957 18.1993 19.5641 18.5977C19.3324 18.9961 19.0006 19.3269 18.6015 19.5573C16.5958 20.7108 14.3133 21.2951 12 21.2473C9.68548 21.2911 7.40292 20.7022 5.3985 19.5441C5.00133 19.3148 4.67071 18.9861 4.4392 18.5902C4.20769 18.1943 4.08328 17.745 4.07821 17.2864V12.0052C6.29784 13.8412 9.12271 14.7828 12 14.6458C14.8773 14.7828 17.7022 13.8412 19.9218 12.0052Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M19.9218 5.4037C17.7022 7.23968 14.8773 8.1813 12 8.0443C9.12271 8.1813 6.29784 7.23968 4.07821 5.4037C6.29784 3.56772 9.12271 2.6261 12 2.7631C14.8773 2.6261 17.7022 3.56772 19.9218 5.4037Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M19.9218 5.40369V12.0052M4.07821 12.0052V5.40369" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>

                <div className="flex items-center gap-[5px]" >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.7533 17.2467 2.5 12 2.5C6.7533 2.5 2.5 6.7533 2.5 12C2.5 17.2467 6.7533 21.5 12 21.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M6.3739 19.6528C6.90736 18.6208 7.71438 17.7554 8.70668 17.1513C9.69897 16.5472 10.8383 16.2277 12 16.2277C13.1617 16.2277 14.301 16.5472 15.2933 17.1513C16.2857 17.7554 17.0926 18.6208 17.6261 19.6528" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 13.0556C13.8772 13.0556 15.3989 11.5339 15.3989 9.6567C15.3989 7.77954 13.8772 6.25781 12 6.25781C10.1228 6.25781 8.60114 7.77954 8.60114 9.6567C8.60114 11.5339 10.1228 13.0556 12 13.0556Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <p>{user?.username}</p>
                </div>

                <div>
                    <svg onClick={handleLogout} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4767 21.2448H8.34067C7.04877 21.3045 5.78536 20.8527 4.82407 19.9876C3.86278 19.1224 3.28099 17.9134 3.2047 16.6224V7.37762C3.28099 6.08659 3.86278 4.87757 4.82407 4.01241C5.78536 3.14724 7.04877 2.69559 8.34067 2.75524H13.4767" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M20.7953 12H7.44174" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" />
                        <path d="M16.0833 17.136L20.4874 12.7319C20.6802 12.5371 20.7884 12.2742 20.7884 12C20.7884 11.7259 20.6802 11.4629 20.4874 11.2681L16.0833 6.86404" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default Header
