import type { CartItem } from "../types"

type Props = {
    cart: CartItem[]
}

export default function Cart({ cart }: Props) {
    const total = cart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity
    }, 0)

    const items = cart.map(item => {
        return (
            <div>
                <h4>{item.product.name}</h4>
                <p>${item.product.price.toFixed(2)} x {item.quantity}</p>
            </div>
        )
    })

    return (
        <>
            <div>Cart</div>
            { items }
            <div>Total: ${total.toFixed(2)}</div>
        </>
    )
}