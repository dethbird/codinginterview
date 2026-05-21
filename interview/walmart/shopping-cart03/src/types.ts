export type Product = {
    id: string,
    name: string,
    description?: string,
    price: number
}

export type CartItem = {
    product: Product,
    quantity: number
}