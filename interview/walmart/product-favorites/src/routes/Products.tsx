import type { Product } from '../types'
import productData from '../mock-products.json'

export default function Products() {

    const products: Product[] = productData as Product[]

    const productList = products.map(product => {
        return (
            <div>
                <h5>{product.name}</h5>
                <p>{product.category}</p>
                <p>${product.price.toFixed(2)}</p>
                <p>{product.rating.toFixed(2)}</p>
                <div>
                    <button type="button">(Un)Favorite</button>
                </div>
            </div>
        )
    })

    return (
        <div>
            <h2>Products</h2>
            <div className='productList'>{productList}</div>
        </div>
    )
}