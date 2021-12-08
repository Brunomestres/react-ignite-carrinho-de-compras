import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const productExists = newCart.find(product => product.id === productId)

      let { data } = await api.get(`stock/${productId}`);
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1
      console.log(currentAmount)

      if(amount > data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        productExists.amount  =  amount
      }else{
        let product = await api.get(`products/${productId}`);

        newCart.push({ ...product.data, amount: 1 });
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };
  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      
      const productIndex  = newCart.findIndex(product => product.id === productId);
      if(productIndex < 0 ){
        toast.error('Erro na remoção do produto');
        return;
      }

      newCart.splice(productIndex, 1);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
      
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const productFind = newCart.find(product => product.id === productId);

      if(amount < 1){
        return;
      }

      let stock = await api.get(`stock/${productId}`);

      if(amount > stock.data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productFind){
        productFind.amount = amount;
      }else{
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }


      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
