import { Product } from "../types";

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

export default function Products() {
    return <div>Products</div>
}