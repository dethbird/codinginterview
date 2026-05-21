import { Link } from 'react-router-dom'

export default function Nav() {
    return (
        <nav>
            <Link to='/'>Products</Link>
            {" | "}
            <Link to='/cart'>Cart</Link>
        </nav>
    );
}