import { Link } from 'react-router-dom'

import type { CartItem } from '../types'

type Props = {
    cart: CartItem[]
}

export default function Nav({ cart }: Props) {
    const count = cart.reduce((sum, item) => {
        return sum + item.quantity
    }, 0)
    return (
        <nav>
            <Link to="/">Products</Link>
            {" | "}
            <Link to="/cart">Cart ({count})</Link>
        </nav>
    )
}