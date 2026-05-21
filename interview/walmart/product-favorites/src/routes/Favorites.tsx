import type { Dispatch, SetStateAction } from 'react';

import type { Favorite } from '../types'

type Props = {
    favorites: Favorite[],
    setFavorites: Dispatch<SetStateAction<Favorite[]>>;
}

export default function Favorites({ favorites, setFavorites }: Props) {

    function removeFavorite(favorite: Favorite) {
        setFavorites(prev => {
            return prev.filter(fav => {
                return fav.product.id !== favorite.product.id
            })
        })
    }



    const averageRating = favorites.reduce((sum, fav) => {
        return sum + fav.product.rating
    }, 0) / favorites.length

    const totalPrice = favorites.reduce((sum, fav) => {
        return sum + fav.product.price
    }, 0)

    const productList = favorites.map(fav => {
        return (
            <div key={fav.product.id}>
                <h5>{fav.product.name}</h5>
                <p>{fav.product.category}</p>
                <p>${fav.product.price.toFixed(2)}</p>
                <p>{fav.product.rating.toFixed(2)}</p>
                <div>
                    <button type="button" onClick={() => removeFavorite(fav)}>Remove</button>
                </div>
            </div>
        )
    })

    return (
        <div>
            <h2>Products</h2>
            <div className='productList'>{productList}</div>
            <hr />
            <p>Average rating: {averageRating.toFixed(2)}</p>
            <p>Total price: ${totalPrice.toFixed(2)}</p>
        </div>
    )
}