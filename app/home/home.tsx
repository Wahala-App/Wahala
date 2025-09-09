import { Button } from "../ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function HomeComponent() {

    const { logout } = useAuth();

    return (
        <div>
            <h1>Home</h1>

            <Button className={"rounded-3xl"} onClick={logout}>Logout</Button>
        </div>
    )
}