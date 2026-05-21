import type { Product } from '../types'

export default function Products() {

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

    const productList = products.map(product => {
        return (
            <div className="product">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p>${product.price.toFixed(2)}</p>
                <p><button type="button">Add to cart</button></p>
            </div>
        )
    })


    return (
        <div className="productList">{productList}</div>
    )
}