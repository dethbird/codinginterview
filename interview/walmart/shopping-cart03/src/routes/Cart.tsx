import type { CartItem } from "../types";

type Props = {
    cart: CartItem[]
}

export default function Cart({ cart }: Props) {

    const cartTotal = cart.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity)
    }, 0)

    const cartItems = cart.map(item => {
        return (
            <div className='product'>
                <h4>{item.product.name}</h4>
                <p>{item.product.description}</p>
                <p>${item.product.price.toFixed(2)} x {item.quantity}</p>
            </div>
        )
    })

    return (
        <>
            <div>{cartItems}</div>
            <hr />
            <div>Total: ${cartTotal.toFixed(2)}</div>
        </>
    );
}