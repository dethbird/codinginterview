import type { CartItem, Product } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
    setCart: Dispatch<SetStateAction<CartItem[]>>
}

const products: Product[] = [
    {
        id: '1',
        name: 'Pizza',
        price: 1.5,
        description: "a slippery slice",
        imageUrl: "https://t3.ftcdn.net/jpg/06/27/81/36/360_F_627813626_bjLLoQXww5AlKs1giaxRW8H7g2woTqll.jpg"

    },
    {
        id: '2',
        name: 'Taco',
        price: 1.75,
        description: "tortilla mania",
        imageUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/e787650692e172db315ce002132f59dd/5954bcb006b10dbfd0bc160f6370faf3.jpeg"

    }
];

export default function Products({ setCart }: Props) {
    const productList = products.map((product: Product) => {

        function addToCart(product: Product) {
            setCart(prev => {
                const existing = prev.find(item => item.product.id === product.id)
                if (existing) {
                    return prev.map(item => 
                        item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1}
                        : item
                    )
                }
                return [...prev, { product, quantity: 1 }]
            })
        }

        return (
            <div key={product.id} className="productItem">
                <img src={product.imageUrl} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p>{product.price.toFixed(2)}</p>
                <p>
                    <button onClick={() => { addToCart(product) }}>Add to cart</button>
                </p>
            </div>
        )
    })
    return <div>{productList}</div>
}