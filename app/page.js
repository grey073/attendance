import AttendanceMarker from "./components/AttendanceMarker";
import Navbar from "./components/Navbar";
import Link from "next/link";
export default function Home() {
    return(
        <main>
             <Navbar />
             <div className="home-actions">
                <Link className="todo-link" href="/todo">
                    Open To-do List →
                </Link>
             </div>
           
             
            <AttendanceMarker />
        </main>
    );
}