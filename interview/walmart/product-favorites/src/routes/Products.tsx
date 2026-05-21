import type { Dispatch, SetStateAction } from 'react';

import type { Product, Favorite } from '../types'
import productData from '../mock-products.json'

type Props = {
    setFavorites: Dispatch<SetStateAction<Favorite[]>>;
}

export default function Products({ setFavorites }: Props) {

    function addRemoveFavorite(product: Product) {
        setFavorites((prev: Favorite[]) => {
            const existing = prev.find(fav => fav.product.id === product.id);
            if (existing) {
                return prev.filter(fav => fav.product.id !== product.id)
            }
            return [...prev, { product }];
        })
    }


    const products: Product[] = productData as Product[]
    const productList = products.map(product => {
        return (
            <div key={product.id}>
                <h5>{product.name}</h5>
                <p>{product.category}</p>
                <p>${product.price.toFixed(2)}</p>
                <p>{product.rating.toFixed(2)}</p>
                <div>
                    <button type="button" onClick={() => addRemoveFavorite(product)}>(Un)Favorite</button>
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