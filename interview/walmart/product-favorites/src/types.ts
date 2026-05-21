export type Product = {
    id: number,
    name: string,
    category: string,
    price: number,
    rating: number
}

export type UserFavorite = {
    product: Product
}