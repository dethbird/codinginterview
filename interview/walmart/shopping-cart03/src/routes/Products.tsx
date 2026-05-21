import type { Product, CartItem } from '../types'

import type { Dispatch, SetStateAction } from 'react';

type Props = {
    setCart: Dispatch<SetStateAction<CartItem[]>>
}

export default function Products({ setCart} : Props) {

    /** @todo fetch products from API */
    const products: Product[] = [
        {
            id: '111',
            name: 'Pizza',
            description: 'a nice slice',
            price: 1.5
        },
        {
            id: '222',
            name: 'Taco',
            description: 'tortilla mania',
            price: 1.25
        },
        {
            id: '333',
            name: 'Hot Dog',
            description: 'bun mania',
            price: 1
        }
    ]

    function addToCart(product: Product) {
        console.log(product);
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if(existing){
                const next = prev.map(item => {
                    return item.product.id === product.id
                    ? {...item, quantity: item.quantity + 1}
                    : item
                })
                return next
            }
            return [...prev, { product, quantity: 1}];
        })
    }

    const productList = products.map(product => {
        return (
            <div className="product">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p>${product.price.toFixed(2)}</p>
                <p><button type="button" onClick={()=>addToCart(product)}>Add to cart</button></p>
            </div>
        )
    })


    return (
        <div className="productList">{productList}</div>
    )
}